const FS = require('node:fs')
const Path = require('node:path')
const file = require('../index')

describe('mkdir', () => {
    test('', () => {
        file.mkdir('a')
        expect(FS.existsSync('a')).toBeTruthy()

        file.mkdir('a/b')
        expect(FS.existsSync('a/b')).toBeTruthy()

        file.mkdir('a/1/2/3')
        expect(FS.existsSync('a/1/2/3')).toBeTruthy()

        file.mkdir('./a/234/563')
        expect(FS.existsSync('./a/234/563')).toBeTruthy()

        file.mkdir(Path.resolve('a'))
        expect(FS.existsSync('a')).toBeTruthy()

        file.mkdir(Path.resolve('a/b'))
        expect(FS.existsSync('a/b')).toBeTruthy()

        file.mkdir(Path.resolve('a/1/2/3'))
        expect(FS.existsSync('a/1/2/3')).toBeTruthy()

        file.mkdir(Path.resolve('a/234/563'))
        expect(FS.existsSync('./a/234/563')).toBeTruthy()
    })
})

describe('rm', () => {
    test('', () => {
        file.rm('./a/234/563')
        expect(FS.existsSync('./a/234/563')).toBeFalsy()

        file.rm('a')
        expect(FS.existsSync('./a')).toBeFalsy()

        file.rm('a/b')
        expect(FS.existsSync('a/b')).toBeFalsy()

        file.rm('a/1/2/3')
        expect(FS.existsSync('a/1/2/3')).toBeFalsy()
    })
})

describe('file R/W', () => {
    let fileContent = `module.exports='hello'`
    test('save', () => {
        file.save('a/1/2/3.js', fileContent)
        expect(require(Path.resolve('a/1/2/3.js'))).toBe('hello')
    })

    test('read', () => {
        expect(file.read('a/1/2/3.js')).toBe(fileContent)
        file.rm('a')
    })
})

describe('isDirectory', () => {
    test('exists dir', () => {
        FS.mkdirSync('a/1/2/3', { recursive: true })
        expect(file.isDirectory('a/1/2/3')).toBeTruthy()
        FS.rmSync('a', { recursive: true })
    })

    test('not exists dir', () => {
        expect(file.isDirectory('a/1/2/3')).toBeFalsy()
        expect(file.isDirectory('a/1/2')).toBeFalsy()
        expect(file.isDirectory('a/1')).toBeFalsy()
        expect(file.isDirectory('a')).toBeFalsy()
    })
})

describe('isFile', () => {
    test('exists dir', () => {
        file.save('a/1/2/3.txt', 'a-3')
        expect(file.isFile('a/1/2/3.txt')).toBeTruthy()
        FS.rmSync('a/1/2/3.txt')
    })

    test('not exists dir', () => {
        expect(file.isFile('a/1/2/3.txt')).toBeFalsy()
    })
})

describe('copy', () => {
    function init() {
        file.save('a/1.txt', 'a_1')
        file.save('a/2.txt', 'a_2')
    }

    function clean() {
        file.rm('a')
        file.rm('b')
    }

    test('dir1 -> dir2', () => {
        init()
        file.copy('a', 'b')
        expect(FS.existsSync('b/1.txt') && FS.existsSync('b/2.txt')).toBeTruthy()
        clean()

        init()
        file.copy('a/', 'b/')
        expect(FS.existsSync('b/1.txt') && FS.existsSync('b/2.txt')).toBeTruthy()
        clean()

        init()
        file.copy('a', 'b/')
        expect(FS.existsSync('b/a/1.txt') && FS.existsSync('b/a/2.txt')).toBeTruthy()
        clean()
    })

    test('dir1/* -> dir2', () => {
        init()
        file.copy('a/', 'b')
        expect(FS.existsSync('b/1.txt') && FS.existsSync('b/2.txt')).toBeTruthy()
        clean()
    })

    test('file -> dir', () => {
        init()
        file.copy('a/1.txt', 'b/')
        expect(FS.readFileSync('b/1.txt', 'utf-8')).toBe('a_1')

        file.copy('a/1.txt', 'b/c/')
        expect(FS.readFileSync('b/c/1.txt', 'utf-8')).toBe('a_1')
        clean()
    })

    test('file1 -> file2', () => {
        init()
        file.copy('a/1.txt', 'b/x.txt')
        expect(FS.readFileSync('b/x.txt', 'utf-8')).toBe('a_1')

        file.copy('a/1.txt', 'b/c/x.txt')
        expect(FS.readFileSync('b/c/x.txt', 'utf-8')).toBe('a_1')
        clean()
    })

    test('copy to self', () => {
        init()
        file.copy('a', 'a/backup/')
        expect(FS.readFileSync('a/backup/a/1.txt', 'utf-8')).toBe('a_1')
        clean()

        init()
        let n = Date.now()
        file.copy('a', `a/backup/${n}`)
        expect(FS.readFileSync(`a/backup/${n}/1.txt`, 'utf-8')).toBe('a_1')
        clean()
    })
})

describe('readdir', () => {
    function init() {
        file.save('a/1.txt', 'a_1')
        file.save('a/c/2.txt', 'a_2')
        file.mkdir('a/b')
        file.mkdir('a/c/d')
    }

    test('no options', () => {
        init()
        expect(file.readdir('a')).toEqual(['a/1.txt', 'a/b', 'a/c'])
    })

    test('all = true', () => {
        expect(file.readdir('a', { all: true })).toEqual(['a/1.txt', 'a/b', 'a/c/2.txt', 'a/c/d'])
    })

    test('onlyLeaf = false', () => {
        expect(file.readdir('a', { all: true, onlyLeaf: false })).toEqual([
            'a/1.txt',
            'a/b',
            'a/c',
            'a/c/2.txt',
            'a/c/d',
        ])
    })

    test('absolute = true', () => {
        expect(file.readdir('a', { absolute: true })).toEqual([
            Path.resolve('a/1.txt'),
            Path.resolve('a/b'),
            Path.resolve('a/c'),
        ])
    })

    test(`rebase = '/'`, () => {
        expect(file.readdir('a', { rebase: '/' })).toEqual(['/1.txt', '/b', '/c'])
    })

    test(`rebase = false`, () => {
        expect(file.readdir('a', { rebase: false })).toEqual(['1.txt', 'b', 'c'])
    })

    test(`filter`, () => {
        file.save('a/imgs/1.png', 'a_1')
        file.save('a/c/imgs/2.jpg', 'a_2')
        file.save('a/c/imgs/3.gif', 'a_3')
        expect(file.readdir('a', { all: true, filter: '*.(jpg|png|gif)' })).toEqual([
            'a/imgs/1.png',
            'a/c/imgs/3.gif',
            'a/c/imgs/2.jpg',
        ])

        expect(file.readdir('a', { all: true, filter: /.(jpg|png|gif)$/ })).toEqual([
            'a/imgs/1.png',
            'a/c/imgs/3.gif',
            'a/c/imgs/2.jpg',
        ])

        expect(file.readdir('a', { all: true, filter: ['*.jpg', '*.gif', '*.png'] })).toEqual([
            'a/imgs/1.png',
            'a/c/imgs/3.gif',
            'a/c/imgs/2.jpg',
        ])

        expect(
            file.readdir('a', { all: true, filter: p => ['.png', '.jpg', '.gif'].includes(Path.extname(p)) })
        ).toEqual(['a/imgs/1.png', 'a/c/imgs/3.gif', 'a/c/imgs/2.jpg'])
    })

    test(`ignore`, () => {
        file.save('a/c/imgs/4.png', 'a_4')
        expect(file.readdir('a/c/imgs', { all: true, ignore: '*.(jpg|png)' })).toEqual(['a/c/imgs/3.gif'])

        expect(file.readdir('a/c/imgs', { all: true, ignore: /.(jpg|png)$/ })).toEqual(['a/c/imgs/3.gif'])

        expect(file.readdir('a/c/imgs', { all: true, ignore: ['*.jpg', '*.png'] })).toEqual(['a/c/imgs/3.gif'])

        expect(
            file.readdir('a/c/imgs', { all: true, ignore: p => ['.png', '.jpg'].includes(Path.extname(p)) })
        ).toEqual(['a/c/imgs/3.gif'])
    })

    test(`ignore`, () => {
        expect(file.readdir('a/imgs', { returnObj: true })).toEqual([
            {
                name: '1.png',
                path: 'a/imgs/1.png',
                isFile: true,
                isDirectory: false,
                isSymbolicLink: false,
                type: 1,
            },
        ])
        file.rm('a')
    })
})

describe('isPath', () => {
    test('', () => {
        expect(file.isPath('a/1/2/3.txt')).toBe(true)
        expect(file.isPath('a/1/2/3')).toBe(true)
        expect(file.isPath('./a/1/2/3.txt')).toBe(true)
        expect(file.isPath('.')).toBe(true)
        expect(file.isPath('')).toBe(false)
        expect(file.isPath('file://a/b')).toBe(false)
        expect(file.isPath('/a')).toBe(true)
        expect(file.isPath('./a')).toBe(true)
        expect(file.isPath('../../../')).toBe(true)
        expect(file.isPath('../a/../')).toBe(true)
        expect(file.isPath('//a')).toBe(true)
        expect(file.isPath('http://a')).toBe(false)
    })
})

describe('isSymbolicLink', () => {
    test('', () => {
        file.mkdir('a')
        FS.symlinkSync('a', 'b')
        expect(file.isSymbolicLink('b')).toBe(true)
        file.rm('a')
        file.rm('b')
    })
})

describe('gitignoreParse', () => {
    test('', () => {
        expect(file.gitignoreParse('.gitignore')).toEqual(['.*', '!.gitignore', '/node_modules/', '*lock.json'])
        expect(file.gitignoreParse('.gitignore', true)).toEqual([
            /\.[^/*]+/i,
            /(\/!\.gitignore\/)|(\/!\.gitignore$)/i,
            /^\/node_modules\/$/i,
            /[^/*]+lock\.json/i,
        ])
    })
})
