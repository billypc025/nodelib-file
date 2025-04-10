/**
 * 同步写文件
 * @param path 目标文件路径
 * @param data 内容
 * @param options.encoding 文件编码,默认`utf8`
 * @param options.mode 访问模式,默认0o666
 * @param options.flag 默认'w'
 * @param options.flush 如果所有数据都成功写入文件，并且 flush 是 true，则使用 fs.fsync() 来刷新数据。默认值：false。
 * @param options.signal 允许中止正在进行的 writeFile
 */
export function save(
    path: string,
    data: string | Buffer,
    options?: { encoding?: string; mode?: number; flag?: string; flush?: Boolean; signal?: AboutSignal }
): Promise<void>
/**
 * 同步读取文件内容
 * @param path 目标文件路径
 * @param options.encoding 文件编码,默认`utf8`
 * @param options.flag 默认'r'
 */
export function read(path: string): Promise<string>
export function read(path: string, options: string | { encoding?: string; flag?: string }): Promise<string | Buffer>
/**
 * 同步创建目录 (递归创建子目录)
 * @param path 目标目录路径
 * @param mode 访问模式, 默认0o777
 */
export function mkdir(path: string, mode?: number | string): Promise<void>
/**
 * 整个目录结构从 src 异步地复制到 dest，包括子目录和文件
 * @param source 源路径
 * @param dest 目标路径
 * @param options 可传入filter 、 ignore 对复制的内容进行限定
 *
 * @example
 *
 * // 复制 dir1 并命名为 dir2
 * file.copy('./dir1', './dir2')
 *
 * // 复制 dir1 到 dir2/dir1
 * file.copy('./dir1', './dir2/')
 *
 * // 复制 dir1 到 自身的备份目录内 (node.js 的 fs.cp 不允许复制到子目录中, file.copy 支持该操作)
 * file.copy('./dir1', './dir1/backup')
 *
 * // 仅复制图片
 * file.copy('./dir1', './dir2', {filter: '*.(jpg|png|git)'})
 *
 * // 不复制 .开头的隐藏文件，不复制 node_moduels
 * file.copy('./dir1', './dir2', {ignore: [/^\/\./, 'node_modules']})
 * 
 */
export function copy(source: string, dest: string, options?: { force: Boolean }): Promise<void>
/**
 * 目标是否目录
 * @param path 目标路径
 * @param link 是否检测符号链接(默认false) 为true时,目录若是符号链接则返回false
 */
export function isDirectory(path: string, link: Boolean): Promise<Boolean>
/**
 * 目标是否文件
 * @param path 目标路径
 * @param link 是否检测符号链接(默认false) 为true时,文件若是符号链接则返回false
 */
export function isFile(path: string, link: Boolean): Promise<Boolean>
/**
 * 目标是否符号连接
 */
export function isSymbolicLink(path: string): Promise<Boolean>
/**
 * 删除文件或目录(包括子目录及内容)
 * @param path
 */
export function rm(path: string): Promise<void>
/**
 * 读取目录清单
 * @param path 文件或目录内容
 * @param options.all 是否包括子目录, 默认false
 * @param options.returnObj 是否返回对象, 默认false返回路径字符串, 为true时返回{name,dir,path,isFile,isDirectory,isSymbolicLink,type}
 * @param options.absolute 是否返回绝对路径, 默认false
 * @param options.onlyLeaf 只保留叶子节点, 默认true
 * @param options.rebase 变基, 默认true:变基为传入的path, false:不变基, 也可以传入要变基的字符串,比如:/
 * @param options.filter 保留命中规则的项(gitignore规则 https://git-scm.com/docs/gitignore),另支持正则和回调函数(见example)
 * @param options.ignore 忽略命中规则的项(gitignore规则 https://git-scm.com/docs/gitignore),另支持正则和回调函数(见example)
 *
 * @example
 * onlyLeaf的作用是在遍历子目录过程中,将非空子目录项去掉(即只保留叶子节点)
 *
 * //比如如下文件列表:
 * ['a',
 * 'a/b',
 * 'a/1.js',
 * 'a/c',
 * 'a/c/2.js']
 *
 * //onlyLeaf=true 后, 结果如下:
 * ['a/b',
 * 'a/1.js',
 * 'a/c/2.js']
 *
 * //这样的好处是, 在后续对文件列表的遍历过程时, 可以直接对最终文件/目录进行操作
 *
 *
 * 注意: 符号链接将会作为file对待, 因为如果符号链接是目录, 那么有可能会套娃而导致死循环
 *
 * 当`options.returnObj`传入true时，返回的对象中type字段表示如下意义:
 *
 * - 1 (UV_DIRENT_FILE): 普通文件。
 * - 2 (UV_DIRENT_DIR): 目录。
 * - 3 (UV_DIRENT_LINK): 符号链接。
 * - 4 (UV_DIRENT_FIFO): 命名管道 (FIFO)。
 * - 5 (UV_DIRENT_SOCKET): 套接字。
 * - 6 (UV_DIRENT_CHAR): 字符设备文件。
 * - 7 (UV_DIRENT_BLOCK): 块设备文件。
 * - 0 (UV_DIRENT_UNKNOWN): 未知类型
 *
 * tips: 原生 fs.readdirSync 是自带递归选项的, 其实已经满足对目录和子目录文件列表的获取了, 那么为什么还需要 file.readdir 呢?
 * tips: 因为很多场景下不希望获取全部的文件目录列表, 只希望获取符合规则的文件列表(比如过滤掉.gitignore中的文件), 如果使用 fs.readdirSync 的结果进行过滤, 效率很可能比较低 (比如有子目录node_modules, 且安装了很多第三方包)
 * tips: file.readdir 会依据 filter 和 ignore 定义的规则过滤筛选, 避免不必要的目录下钻
 *
 * @example
 * // 获取web_root的文件清单, 并改变base为'/':
 *
 * file.readdir('./dist/web_root', {all:true, rebase:'/'})
 * // => ['/index.html', '/js/main.css', '/css/index.css']
 *
 * @example
 * // 忽略 node_modules
 * file.readdir('./dist/web_root', {all:true, ignore:'node_modules'})
 *
 * @example
 * // 从.gitignore读取忽略项
 *
 * let ignore = file.gitignoreParse('.gitignore')
 * file.readdir('./dist/web_root', {all:true, ignore})
 *
 * @example
 * //忽略所有图片
 * file.readdir('./dist/web_root', {all:true, ignore:'*.(png|jpg|jpeg|gif)'})
 *
 * @example
 * //使用自定义函数进行忽略设置
 *
 * file.readdir('./dist/web_root', {all:true, ignore:(v)=>v=='/node_modules/'})
 * //需要注意的是: 当使用自定义函数时, 接受的入参并非真实的文件路径, 而是以path为根的相对路径
 *
 * // filter 和 ignore的用户完全一样, 区别是filter命中的文件会保留, ignore命中的文件会忽略
 *
 * @example
 * // 获取上级目录中的所有文件, 忽略node_moduels、json、图片, 以及.开头的文件
 * fs.readdir('../', {
 *    rebase: false,
 *    onlyLeaf: true,
 *    all: true,
 *    ignore: ['node_modules/', '.git/', '*.json', '*.(jpg|png|gif)', /\/\./],
 * })
 *
 * // 注意: ignore 和 filter 在编写正则和校验函数时, 收到的路径第一位永远是/, 表示basePath
 * // rebase: false 表示移除basePath
 * // onlyLeaf: true 表示只获取文件, 排除目录
 */
export function readdir(
    path: string,
    options?: {
        /**
         * 是否包括子目录, 默认false
         */
        all?: Boolean
        /**
         * 是否返回对象, 默认false返回路径字符串, 为true时返回{name,dir,path,isFile,isDirectory,isSymbolicLink,type}
         */
        returnObj?: false
        /**
         * 是否返回绝对路径, 默认false
         */
        absolute?: Boolean
        /**
         * 只保留叶子节点, 默认true (即返回列表只会有文件或空目录)
         */
        onlyLeaf?: Boolean
        /**
         * 变基, 默认true:变基为传入的path, false:不变基, 也可以传入要变基的字符串,比如:/
         */
        rebase?: Boolean | string
        /**
         * 保留命中规则的项(gitignore规则 https://git-scm.com/docs/gitignore),另支持正则和回调函数(见example)
         */
        filter?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
        /**
         * 忽略命中规则的项(gitignore规则 https://git-scm.com/docs/gitignore),另支持正则和回调函数(见example)
         */
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): Promise<string[]>
export function readdir(
    path: string,
    options?: {
        /**
         * 是否包括子目录, 默认false
         */
        all?: Boolean
        /**
         * 是否返回对象, 默认false返回路径字符串, 为true时返回{name,dir,path,isFile,isDirectory,isSymbolicLink,type}
         */
        returnObj?: true
        /**
         * 是否返回绝对路径, 默认false
         */
        absolute?: Boolean
        /**
         * 只保留叶子节点, 默认true (即返回列表只会有文件或空目录)
         */
        onlyLeaf?: Boolean
        /**
         * 变基, 默认true:变基为传入的path, false:不变基, 也可以传入要变基的字符串,比如:/
         */
        rebase?: Boolean | string
        /**
         * 保留命中规则的项(gitignore规则 https://git-scm.com/docs/gitignore),另支持正则和回调函数(见example)
         */
        filter?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
        /**
         * 忽略命中规则的项(gitignore规则 https://git-scm.com/docs/gitignore),另支持正则和回调函数(见example)
         */
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): Promise<
    { name: string; path: string; isFile: Boolean; isDirectory: Boolean; isSymbolicLink: Boolean; type: number }[]
>
/**
 * 在目录中搜索指定规则的文件
 * @param dir 目录路径
 * @param match 可以是扩展名, 正则, 或一个返回Boolean的回调方法
 * @param options.all 是否包括子目录, 默认false
 * @param options.returnObj 是否返回对象, 默认false返回路径字符串, 为true时返回{name,dir,path,isFile,isDirectory,isSymbolicLink,type}
 * @param options.absolute 是否返回绝对路径, 默认false
 * @param options.onlyLeaf 结果是否排除目录, 默认true
 * @param options.ignore 忽略命中规则的项(gitignore规则 https://git-scm.com/docs/gitignore),另支持正则和回调函数(见example)
 */
export function search(
    dir: string,
    match: string | RegExp | ((path: string) => Boolean),
    options?: {
        all?: Boolean
        returnObj?: false
        absolute?: Boolean
        onlyLeaf?: Boolean
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): Promise<string[]>
export function search(
    dir: string,
    match: string | RegExp | ((path: string) => Boolean),
    options: {
        all: Boolean
        returnObj: true
        absolute: Boolean
        onlyLeaf: Boolean
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): Promise<
    { name: string; path: string; isFile: Boolean; isDirectory: Boolean; isSymbolicLink: Boolean; type: number }[]
>
/**
 * 判断字符串是否是文件路径
 * @param str 目标字符串
 */
export function isPath(str: string): Promise<Boolean>
/**
 * 解析'.gitignore'文件, 获取ignore规则列表, 可转换为正则表达式
 * @param path .gitignore文件路径
 * @param returnRegExp 是否转换为正则表达式, 默认false不转换
 *
 * @example
 *
 * # .gitignore
 * # -----------
 * /node_modules/
 * .vscode
 * # -----------
 *
 * file.gitignoreParse('.gitignore')
 * // => ['/node_modules/', '.vscode']
 *
 * file.gitignoreParse('.gitignore', true)
 * // => [/^\/node_modules\/$/i, /(\/\.vscode\/)|(\/\.vscode$)/i]
 */
export function gitignoreParse(path: string, returnRegExp: false): Promise<string[]>
export function gitignoreParse(path: string, returnRegExp: true): Promise<RegExp[]>
