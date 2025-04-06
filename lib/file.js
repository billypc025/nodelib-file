const FS = require('node:fs')
const Path = require('node:path')
const utils = require('./utils')
const promises = require('./filePromises')
const Default_Encoding = 'utf-8'

function save(path, data, options) {
    try {
        mkdir(Path.dirname(path))
        FS.writeFileSync(path, data, options || Default_Encoding)
    } catch (err) {
        throw err
    }
}

function mkdir(path, mode = 0o777) {
    try {
        FS.mkdirSync(path, { recursive: true, mode })
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}

function read(path, options) {
    try {
        return FS.readFileSync(path, options || Default_Encoding)
    } catch (err) {
        throw err
    }
}

function copy(source, dest, options = {}) {
    let { filter, ignore } = options
    options = { all: true, onlyLeaf: true, filter, ignore }

    !source.endsWith(Path.sep) && dest.endsWith(Path.sep) && (dest = Path.join(dest, Path.basename(source)))
    if (FS.cp) {
        if (!Path.relative(source, dest).startsWith('.')) {
            let fileList = readdir(source, options)
            for (let file of fileList) {
                let dest1 = Path.join(dest, file)
                if (isDirectory(file)) {
                    mkdir(dest1)
                } else {
                    FS.cpSync(file, dest1, { force: true, recursive: true })
                }
            }
        } else {
            filter = utils.ignoreParse(filter)
            ignore = utils.ignoreParse(ignore)
            FS.cpSync(source, dest, {
                force: true,
                recursive: true,
                ...(ignore && { filter: s => !utils.matchFilter(ignore, `/${Path.relative(source, s)}`) }),
                ...(filter && { filter: s => utils.matchFilter(filter, `/${Path.relative(source, s)}`) }),
            })
        }
    } else {
        let fileList = readdir(source, options)
        for (let file of fileList) {
            let dest1 = Path.join(dest, file)
            mkdir(Path.dirname(dest1))
            FS.copyFileSync(file, dest1)
        }
    }
}

function isDirectory(path, checkLink = false) {
    try {
        return FS[checkLink ? 'lstatSync' : 'statSync'](path).isDirectory()
    } catch {
        return false
    }
}

function isFile(path, checkLink = false) {
    try {
        return FS[checkLink ? 'lstatSync' : 'statSync'](path).isFile()
    } catch {
        return false
    }
}

function isSymbolicLink(path) {
    try {
        return FS.lstatSync(path).isSymbolicLink()
    } catch {
        return false
    }
}

function rm(path, opts = {}) {
    if (FS.rmSync) {
        // rmSync added in v14.14.0 (support recursive)
        FS.rmSync(path, { ...opts, recursive: true, force: true })
    } else {
        if (isFile(path)) {
            FS.unlinkSync(path)
        } else {
            FS.rmdirSync(path, opts)
        }
    }
}

function readdir(path, options = {}) {
    //注意: 符号链接将会作为file对待, 因为如果符号链接是目录, 那么有可能会套娃而导致死循环
    let list,
        { all, returnObj, absolute, onlyLeaf = true, rebase = true, filter, ignore, _base = '/' } = options
    filter = utils.ignoreParse(filter)
    ignore = utils.ignoreParse(ignore)
    options = { all, returnObj, absolute, onlyLeaf, filter, ignore }
    if (!isDirectory(path)) {
        let name = Path.basename(path),
            stat = FS.lstatSync(path)
        path = absolute ? Path.resolve(path) : rebase === true ? path : !rebase ? name : Path.join(`${rebase}`, name)
        if (returnObj) {
            return [
                {
                    name,
                    path,
                    isFile: stat.isFile(),
                    isDirectory: stat.isDirectory(),
                    isSymbolicLink: stat.isSymbolicLink(),
                    type: utils.getStatType(stat),
                },
            ]
        }
        return [path]
    }
    /**
     * TIP:
     * 原生 fs.readdirSync 是自带递归选项的, 其实已经满足对目录和子目录文件列表的获取了, 那么为什么还需要 file.readdir 呢?
     * 因为很多场景下不希望获取全部的文件目录列表, 只希望获取符合规则的文件列表(比如过滤掉.gitignore中的文件), 如果使用 fs.readdirSync 的结果进行过滤, 效率很可能比较低 (比如有子目录node_modules, 且安装了很多第三方包)
     *
     * file.readdir 会依据 filter 和 ignore 定义的规则过滤筛选, 避免不必要的目录下钻
     */
    list = FS.readdirSync(path, { withFileTypes: returnObj === true })
    rebase === true && (rebase = path)
    filter && (filter.list = filter.list || [])
    return all || absolute || returnObj || onlyLeaf || rebase || filter || ignore
        ? (utils.arrayReplace(list, (v, i, a, d, l, m, n, s, t, r) =>
              returnObj
                  ? ((m = Path.join(rebase || '', v.name)),
                    (n = Path.join(v.parentPath ?? v.path, v.name)),
                    (t = `${_base}${v.name}`) && v.isDirectory() && ((s = true), (t += '/')),
                    (r =
                        ignore && utils.matchFilter(ignore, t)
                            ? d()
                            : ((options = { ...options, rebase: m ?? v, _base: t }),
                              (l = all && s ? readdir(n, options) : []),
                              l.length > 0 && all && s && a.splice(i + 1, 0, ...l),
                              onlyLeaf && s && l.length > 0
                                  ? d()
                                  : {
                                        name: v.name,
                                        path: absolute ? Path.resolve(n) : m,
                                        isFile: v.isFile(),
                                        isDirectory: v.isDirectory(),
                                        isSymbolicLink: v.isSymbolicLink(),
                                        type: v[Object.getOwnPropertySymbols(v)[0]],
                                    })),
                    r && filter && utils.matchFilter(filter, t) && filter.list.push(r),
                    r)
                  : ((m = absolute ? false : rebase ? Path.join(rebase, v) : v),
                    (n = Path.join(path, v)),
                    (t = `${_base}${v}`) && isDirectory(n, true) && ((s = true), (t += '/')),
                    (r =
                        ignore && utils.matchFilter(ignore, t)
                            ? d()
                            : ((options = { ...options, rebase: m ?? v, _base: t }),
                              (l = all && s ? readdir(n, options) : []),
                              l.length > 0 && a.splice(i + 1, 0, ...l),
                              onlyLeaf && s && l.length > 0 ? d() : absolute ? Path.resolve(n) : m)),
                    r && filter && utils.matchFilter(filter, t) && filter.list.push(r),
                    r)
          ),
          filter && filter.list && filter.list.length > 0 && _base == '/' && (list = filter.list),
          list)
        : list
}

function search(dir, match, options = {}) {
    let { all, returnObj, onlyLeaf, absolute, ignore } = options
    if (!match.startsWith('.') && (match = '.' + match)) {
        match = '*' + match
    }
    return isDirectory(dir) ? readdir(dir, { all, returnObj, onlyLeaf, absolute, ignore, filter: match }) : []
}

function isPath(str) {
    str = str.replace(/^\s+|\s+$/g, '')
    if (process.platform === 'win32') {
        if ([/^(\.{1,2}\/){0,1}[^:/\*?|"<>]+$/, /^[a-zA-Z]:\\[^,:;/\*?|!'"<>[]{}\t\r\n]+$/].some(v => v.test(str))) {
            return true
        }
    } else if ([/^(\.{1,2}\/){0,1}[^:]+$/, /^\/[^:]+$/].some(v => v.test(str))) {
        return true
    }
    return false
}

function gitignoreParse(path, returnRegExp = false) {
    return read(path)
        .split('\n')
        .replace(
            (v, i, a, d) => (
                (v = trim(v)), !v || v[0] == '#' || v[0] == ':' ? d() : returnRegExp ? utils.ignoreToRegExp(v) : v
            )
        )
}

module.exports = {
    isDirectory,
    isFile,
    isSymbolicLink,
    isPath,
    save,
    read,
    mkdir,
    copy,
    rm,
    readdir,
    search,
    gitignoreParse,
    promises,
}
