const PathMatchRules = [
    path => {
        // 'foo', 'foo/', '/foo', '/foo/'
        let match = path.match(/^\/?[^*/]+\/?$/g)
        if (match) {
            path = path.replace(/\./g, '\\.').replace(/\?/g, '[^/]')
            if (path[0] == '/') {
                path = '^' + path
            } else {
                path = '/' + path
            }
            if (path[path.length - 1] == '/') {
                path = `${path}$`
            } else {
                path = `(${path}\/)|(${path}$)`
            }
            return new RegExp(path, 'i')
        }
        return null
    },
    path => {
        // 双星 **
        let match = path.match(/^\*{2}$|(^\*{2}[^*])|([^*]\*{2}$)|([^*]\*{2}[^*])/g)
        if (match) {
            if (/[^/]\/[^/]/.test(path) && path[0] != '/') {
                path = '/' + path
            }
            path = path.replace(/\./g, '\\.').replace(/\?/g, '[^/]')
            let regStr = path.replace(/\*{2}/g, '[^*]+')
            if (path[0] === '/') {
                regStr = '^' + regStr
            }
            return new RegExp(regStr, 'i')
        }
        return null
    },
    path => {
        // 单个*
        let match = path.match(/^\*$|(^\*[^*])|([^*]\*$)|([^*]\*[^*])/g)
        if (match) {
            if (/[^/]\/[^/]/.test(path) && path[0] != '/') {
                path = '/' + path
            }
            if (/\*\.[^/*]+?$/.test(path)) {
                path = path + '$'
            }
            path = path.replace(/\./g, '\\.').replace(/\?/g, '[^/]')
            let regStr = path.replace(/\*/g, '[^/*]+')
            if (path[0] === '/') {
                regStr = '^' + regStr
            }
            return new RegExp(regStr, 'i')
        }
        return null
    },
]

function arrayMatch(arr, cb) {
    let result = null
    for (let i = 0; i < arr.length; i++) {
        result = cb(arr[i], Number(i), arr)
        if (result) return result
    }
    return result
}

function arrayReplace(arr, cb) {
    for (let i = arr.length - 1, v; i >= 0; i--) {
        v =
            cb &&
            cb(arr[i], i, arr, () => {
                arr.splice(i, 1)
            })
        v !== undefined && (arr[i] = v)
    }
    return arr
}

async function arrayReplaceAsync(arr, cb) {
    for (let i = arr.length - 1, v; i >= 0; i--) {
        v = await cb(arr[i], i, arr, () => {
            arr.splice(i, 1)
        })
        v !== undefined && (arr[i] = v)
    }
    return arr
}

function getStatType(stat) {
    return arrayMatch(
        ['isFile', 'isDirectory', 'isSymbolicLink', 'isFIFO', 'isSocket', 'isCharacterDevice', 'isBlockDevice'],
        (v, i) => stat[v]() && i + 1
    )
}

function ignoreParse(rule) {
    return !rule
        ? null
        : (typeof rule == 'object' && rule.$parsed === true) || typeof rule == 'function'
        ? rule
        : typeof rule == 'string' || rule instanceof RegExp
        ? add([ignoreToRegExp(rule)], { $parsed: true })
        : Array.isArray(rule)
        ? add(
              rule.map(v => ignoreToRegExp(v)),
              { $parsed: true }
          )
        : null
}

function ignoreToRegExp(str) {
    return str instanceof RegExp ? str : arrayMatch(PathMatchRules, f => f(str))
}

function matchFilter(rules, item) {
    return typeof rules == 'function' ? !!rules(item) : !!arrayMatch(rules, r => item.match(r))
}

function add(obj1, obj2) {
    return obj2 && Object.keys(obj2).forEach(k => (obj1[k] = obj2[k])), obj1
}

module.exports = {
    arrayReplace,
    arrayReplaceAsync,
    getStatType,
    ignoreParse,
    ignoreToRegExp,
    matchFilter,
}
