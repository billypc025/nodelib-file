# nodelib-file

FS toolkit, `copy`, `search`, `readdir` with customize filter or ingore rules (support . gitignore), as well as some common file operation methods

# Use

```shell
$ npm install nodelib-file
```

## Sync function

```javascript
const File = require('nodelib-file')

File.save(filePath, fileContent)

File.read(filePath, fileContent)

File.copy('./dir1', './dir2') // dir1 -> dir2

File.copy('./dir1', './dir2/')  // dir1 -> dir2/dir1

File.copy('./dir1', './dir2', filter:'*.js')  // filter js
File.copy('./dir1', './dir2', filter:['*.js','*.json'])  // filter js, json
File.copy('./dir1', './dir2', filter:'*(js|json)')  // filter js, json
File.copy('./dir1', './dir2', ignore: ['node_modules', /^\/\./])  // exclude node_modules, exclude .files

File.mkdir(dir_path) //ensure dir

File.readdir('./web_root', { rebase: '/', all: true, ignore: '*.(jpg|png)' })
// => ['/index.html', 'index.js', ... ]

File.readdir('./web_root', { rebase: '/', all: true, filter: '*.(jpg|png)' })
// => ['/imgs/bg.png', 'imgs/logo.png', ...]

File.readdir('./projectDir', { rebase: false, all: true, ignore: ['*.json', 'node_modules', /\/\./] })
// => ['index.js', 'readme.md', ...]

// get file listing by .gitignore
File.readdir('./dist/web_root', { all: true, ignore: File.gitignoreParse('.gitignore') })
```

## Async function

```javascript
const File = require('nodelib-file').promises

;(async () => await File.save(filePath, fileContent))()

//All Async function same as Sync function
```

# API

## `readdir()`

读取目录清单

```typescript
// typescript declaration

readdir(
    path: string,
    options?: {
        all?: Boolean
        returnObj?: false
        absolute?: Boolean
        onlyLeaf?: Boolean
        rebase?: Boolean | string
        filter?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): string[]

readdir(
    path: string,
    options?: {
        all?: Boolean
        returnObj?: true
        absolute?: Boolean
        onlyLeaf?: Boolean
        rebase?: Boolean | string
        filter?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): { name: string; path: string; isFile: Boolean; isDirectory: Boolean; isSymbolicLink: Boolean; type: number }[]
```

| param               | description                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`              | 文件或目录路径<br>file path or directory path                                                                                                                                                                 |
| `options.all`       | 是否包括子目录, 默认 false                                                                                                                                                                                    |
| `options.returnObj` | 是否返回 Dirent, 默认 `false` 返回 String<br>`true` - return `{name,dir,path,isFile,isDirectory,isSymbolicLink,type}`<br>[(See Node.js fs.Dirent)](https://nodejs.org/docs/latest/api/fs.html#class-fsdirent) |
| `options.absolute`  | 是否返回绝对路径, 默认 `false`                                                                                                                                                                                |
| `options.onlyLeaf`  | 只保留叶子节点, 默认 `true`                                                                                                                                                                                   |
| `options.rebase`    | 变基, 默认 true:变基为传入的 path, false:不变基, 也可以传入要变基的字符串,比如:/                                                                                                                              |
| `options.filter`    | 保留命中规则的项[(gitignore 规则)](https://git-scm.com/docs/gitignore), 另支持正则和回调函数(见 example)                                                                                                      |
| `options.ignore`    | 忽略命中规则的项[(gitignore 规则)](https://git-scm.com/docs/gitignore), 另支持正则和回调函数(见 example)                                                                                                      |

> **Tips:**
>
> `onlyLeaf` 的作用是在遍历子目录过程中,将非空子目录项去掉(即只保留叶子节点)
>
> ```javascript
> // Directory tree:
>
> a/
> ├── b/                   # leaf (empty dir)
> ├── c/
> │   ├── 2.js             # leaf
> │   └── d/               # leaf (empty dir)
> └── 1.js                 # leaf
>
> // onlyLeaf = false
> ['a', 'a/b', 'a/1.js', 'a/c', 'a/c/2.js', 'a/c/d']
>
> // onlyLeaf = true
> ['a/b', 'a/1.js', 'a/c/2.js', 'a/c/d']
> ```
>
> 这样的好处是, 在后续对文件列表的遍历过程时, 可以直接对最终文件进行操作 (比如复制等操作)

> **Tips:**
>
> 符号链接将会作为 file 对待, 因为如果符号链接是目录, 那么有可能会套娃而导致死循环

> **Tips:**
>
> `options.returnObj = true`, 返回结果的 `type`:
>
> -   `1` (`UV_DIRENT_FILE`): 普通文件。
> -   `2` (`UV_DIRENT_DIR`): 目录。
> -   `3` (`UV_DIRENT_LINK`): 符号链接。
> -   `4` (`UV_DIRENT_FIFO`): 命名管道 (FIFO)。
> -   `5` (`UV_DIRENT_SOCKET`): 套接字。
> -   `6` (`UV_DIRENT_CHAR`): 字符设备文件。
> -   `7` (`UV_DIRENT_BLOCK`): 块设备文件。
> -   `0` (`UV_DIRENT_UNKNOWN`): 未知类型
>
> [(See Node.js fs constants)](https://github.com/nodejs/node/blob/c17dcb32533aa007dfbf507d22c28ef3c7c11c29/lib/internal/fs/utils.js#L72-L79)

```javascript
// 获取web_root的文件清单, 并改变base为'/':

g.file.readdir('./dist/web_root', { all: true, rebase: '/' })
// => ['/index.html', '/js/main.css', '/css/index.css']
```

```javascript
// 忽略 node_modules
g.file.readdir('./dist/web_root', { all: true, ignore: 'node_modules' })
```

```javascript
// 从.gitignore读取忽略项
let ignore = g.file.gitignoreParse('.gitignore')
g.file.readdir('./dist/web_root', { all: true, ignore })
```

```javascript
//忽略所有图片
g.file.readdir('./dist/web_root', { all: true, ignore: '*.(png|jpg|jpeg|gif)' })
```

```javascript
//使用自定义函数进行忽略设置
g.file.readdir('./dist/web_root', { all: true, ignore: v => v == '/node_modules/' })

//需要注意的是: 当使用自定义函数时, 接受的入参并非真实的文件路径, 而是以path为根的绝对路径
// filter 和 ignore的用户完全一样, 区别是filter命中的文件会保留, ignore命中的文件会忽略
```

```javascript
// 获取上级目录中的所有文件, 忽略node_moduels、json、图片, 以及.开头的文件
fs.readdir('../', {
    rebase: false,
    onlyLeaf: true,
    all: true,
    ignore: ['node_modules/', '.git/', '*.json', '*.(jpg|png|gif)', /\/\./],
})

// rebase: false 表示移除basePath
// onlyLeaf: true 表示只获取文件, 排除目录
```

```javascript
// 获取上级目录中的所有文件, 忽略node_moduels、json、图片, 以及.开头的文件
fs.readdir('../', {
    rebase: false,
    onlyLeaf: true,
    all: true,
    ignore: ['node_modules/', '.git/', '*.json', '*.(jpg|png|gif)', /^\/\./],
})

// 注意: ignore 和 filter 在编写正则和校验函数时, 收到的路径第一位永远是/, 表示basePath
// rebase: false 表示移除basePath
// onlyLeaf: true 表示只获取文件, 排除目录
```

## `copy()`

整个目录结构从 src 异步地复制到 dest，包括子目录和文件

```typescript
// typescript declaration

copy(source: string, dest: string, options?: { force: Boolean }): void
```

| param     | description                                      |
| --------- | ------------------------------------------------ |
| `source`  | 源路径                                           |
| `dest`    | 目标路径                                         |
| `options` | 可传入 `filter` 、 `ignore` 对复制的内容进行限定 |

### Support 6 cases:

1.  Copy & Rename

    -   `path/dir1` copy to `path/dir2`
        ```javascript
        file.copy('path/dir1', 'path/dir2')
        file.copy('path/dir1/', 'path/dir2/') // same as above
        ```
    -   `path/file1` copy to `path/file2`
        ```javascript
        file.copy('path/file1', 'path/file2')
        ```

2.  Copy all files from a directory to another

    `path/dir1/*` copy to `path/dir2/`

    ```javascript
    file.copy('path/dir1/', 'path/dir2')
    file.copy('path/dir1/', 'path/dir2/') // same as 'path/dir2'
    ```

3.  Copy file to existing directory

    `path/file` copy to `path/dir/file`

    ```javascript
    file.copy('path/file', 'path/dir')
    file.copy('path/file', 'path/dir/') // same as 'path/dir'
    ```

4.  Copy file to new directory

    `path/file` copy to `path/dir/file` _(path/dir not exist)_

    ```javascript
    // mkdir path/dir automatically
    file.copy('path/file', 'path/dir/file')
    file.copy('path/file', 'path/dir/')
    ```

5.  Copy directory to another directory

    `path/dir1` copy to `path/dir2/dir1`

    ```javascript
    file.copy('path/dir1', 'path/dir2/')
    file.copy('path/dir1', 'path/dir2/dir1') // same as 'path/dir2/'
    ```

6.  Copy the directory into its own subdirectories

    `path/dir1` copy to `path/dir1/subdir/{newName}`

    > node.js 提供了 `fs.copy` 方法, 但不能进行复制自身成为子目录的操作, 因为 Node.js fs 在 copy 时是动态提取当前目录内的文件的, 因此会报错。
    >
    > 而 nodelib-file 在检测到这个操作时, 会一次性提取要复制的文件, 并避开会产生循环嵌套的目录。

    ```javascript
    // 比如实现开发期间的备份功能, 也许有一些特殊情况下会很有用

    file.copy('path/dir1', 'path/dir1/.backup/2025-05-08')
    ```

```javascript
// 复制 dir1 并命名为 dir2
file.copy('./dir1', './dir2')

// 复制 dir1 到 dir2/dir1
file.copy('./dir1', './dir2/')

// 复制 dir1 到 自身的备份目录内 (node.js 的 fs.cp 不允许复制到子目录中, file.copy 支持该操作)
file.copy('./dir1', `./dir1/backup-${Date.now()}`)

// 仅复制图片
file.copy('./dir1', './dir2', { filter: '*.(jpg|png|git)' })

// 不复制 .开头的隐藏文件，不复制 node_moduels
file.copy('./dir1', './dir2', { ignore: [/^\/\./, 'node_modules'] })
```

## `rm()`

删除文件或目录(包括子目录及内容)

```typescript
// typescript declaration

rm(path: string): void
```

| param  | description                       |
| ------ | --------------------------------- |
| `path` | 要删除的路径, (file or directory) |

## `gitignoreParse()`

解析'.gitignore'文件, 获取 ignore 规则列表, 可转换为正则表达式

```typescript
// typescript declaration

gitignoreParse(path: string, returnRegExp: false): string[]

gitignoreParse(path: string, returnRegExp: true): RegExp[]
```

| param          | description                           |
| -------------- | ------------------------------------- |
| `path`         | .gitignore 文件路径                   |
| `returnRegExp` | 是否返回正则列表, 默认 `false` 不转换 |

以下示例展示了读取.gitignore 文件后  
用这个文件过滤项目目录的文件清单, 得到了加入到 git 版本控制的所有文件  
这对于开发一些代码检查格式化工具等比较有用

```ini
# .gitignore
# -----------
/node_modules/
.vscode
# -----------
```

```javascript
g.file.gitignoreParse('.gitignore')
// => ['/node_modules/', '.vscode']

g.file.gitignoreParse('.gitignore', true)
// => [/^\/node_modules\/$/i, /(\/\.vscode\/)|(\/\.vscode$)/i]
```

## `isDirectory()`

目标是否目录

```typescript
// typescript declaration

isDirectory(path: string, link: Boolean): Boolean
```

| param  | description                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------ |
| `path` | 目标路径                                                                                         |
| `link` | 是否检测符号链接<br> `false` (default) - 忽略 symLink<br>`true` - 目录若是符号链接则返回 `false` |

## `isFile()`

目标是否文件

```typescript
// typescript declaration

isFile(path: string, link: Boolean): Boolean
```

| param  | description                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------ |
| `path` | 目标路径                                                                                         |
| `link` | 是否检测符号链接<br> `false` (default) - 忽略 symLink<br>`true` - 文件若是符号链接则返回 `false` |

## `isPath()`

判断字符串是否是文件路径, 和`isDirectory`、`isFile` 不同, 仅仅检测字符串是否是一个有效的路径格式, 而不判断文件是否存在

```typescript
// typescript declaration

isPath(str: string): Boolean
```

| param | description |
| ----- | ----------- |
| `str` | 目标字符串  |

```javascript
;['./aa', 'a', '/a/b/', '1.js'].forEach(path => console.log(file.isPath(path)))
// => true
// => true
// => true
// => true
```

## `isSymbolicLink()`

目标是否符号连接

```typescript
// typescript declaration

isSymbolicLink(path: string): Boolean
```

## `mkdir()`

同步创建目录 (递归创建子目录)

```typescript
// typescript declaration

mkdir(path: string, mode?: number | string): void
```

| param  | description            |
| ------ | ---------------------- |
| `path` | 目标目录路径           |
| `mode` | 访问模式, 默认 `0o777` |

## `read()`

同步读取文件内容

```typescript
// typescript declaration

read(path: string): string

read(path: string, options: string | { encoding?: string; flag?: string }): string | Buffer
```

| param              | description            |
| ------------------ | ---------------------- |
| `path`             | 目标文件路径           |
| `options.encoding` | 文件编码,默认 `'utf8'` |
| `options.flag`     | 默认 `'r'`             |

## `save()`

同步写文件

```typescript
// typescript declaration

save(
    path: string,
    data: string | Buffer,
    options?: { encoding?: string; mode?: number; flag?: string; flush?: Boolean; signal?: AboutSingal }
): void
```

| param                 | description                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `path`                | 目标文件路径                                                                                  |
| `data`                | 内容                                                                                          |
| `options.encoding`    | 文件编码,默认`utf8`                                                                           |
| `options.mode`        | 访问模式,默认 `0o666`                                                                         |
| `options.flag`        | 默认`'w'`                                                                                     |
| `options.flush`       | 如果所有数据都成功写入文件，并且 flush 是 true，则使用 fs.fsync() 来刷新数据。默认值：`false` |
| `options.AboutSingal` | 允许中止正在进行的 writeFile                                                                  |

## `search()`

在目录中搜索指定规则的文件

```typescript
// typescript declaration

search(
    dir: string,
    match: string | RegExp | ((path: string) => Boolean),
    options?: {
        all?: Boolean
        returnObj?: false
        absolute?: Boolean
        onlyLeaf?: Boolean
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): string[]

search(
    dir: string,
    match: string | RegExp | ((path: string) => Boolean),
    options: {
        all: Boolean
        returnObj: true
        absolute: Boolean
        onlyLeaf: Boolean
        ignore?: string | RegExp | (string | RegExp)[] | ((path: string) => Boolean)
    }
): { name: string; path: string; isFile: Boolean; isDirectory: Boolean; isSymbolicLink: Boolean; type: number }[]
```

| param               | description                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dir`               | 目录路径                                                                                                                                                                                                |
| `match`             | 可以是扩展名, 正则, 或一个返回 Boolean 的回调方法                                                                                                                                                       |
| `options.all`       | 是否包括子目录, 默认 `false`                                                                                                                                                                            |
| `options.returnObj` | 是否返回对象, 默认 false 返回路径字符串, 为 true 时返回`{name,dir,path,isFile,isDirectory,isSymbolicLink,type}`<br>[(See Node.js fs.Dirent)](https://nodejs.org/docs/latest/api/fs.html#class-fsdirent) |
| `options.absolute`  | 是否返回绝对路径, 默认 `false`                                                                                                                                                                          |
| `options.onlyLeaf`  | 结果是否排除目录, 默认 `true`                                                                                                                                                                           |
| `options.ignore`    | 忽略命中规则的项 [(参见 .gitignore 规则)](https://git-scm.com/docs/gitignore), 支持正则和回调函数                                                                                                       |
