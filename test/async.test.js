const FS = require('node:fs')
const Path = require('node:path')
const file = require('../promises')

describe('mkdir', () => {
    test('', async () => {
        await file.mkdir('a')
        expect(FS.existsSync('a')).toBeTruthy()

        await file.mkdir('a/b')
        expect(FS.existsSync('a/b')).toBeTruthy()

        await file.mkdir('a/1/2/3')
        expect(FS.existsSync('a/1/2/3')).toBeTruthy()

        await file.mkdir('./a/234/563')
        expect(FS.existsSync('./a/234/563')).toBeTruthy()

        await file.mkdir(Path.resolve('a'))
        expect(FS.existsSync('a')).toBeTruthy()

        await file.mkdir(Path.resolve('a/b'))
        expect(FS.existsSync('a/b')).toBeTruthy()

        await file.mkdir(Path.resolve('a/1/2/3'))
        expect(FS.existsSync('a/1/2/3')).toBeTruthy()

        await file.mkdir(Path.resolve('a/234/563'))
        expect(FS.existsSync('./a/234/563')).toBeTruthy()
    })
})

describe('rm', () => {
    test('', async () => {
        await file.rm('./a/234/563')
        expect(FS.existsSync('./a/234/563')).toBeFalsy()

        await file.rm('a')
        expect(FS.existsSync('./a')).toBeFalsy()

        await file.rm('a/b')
        expect(FS.existsSync('a/b')).toBeFalsy()

        await file.rm('a/1/2/3')
        expect(FS.existsSync('a/1/2/3')).toBeFalsy()
    })
})

describe('file R/W', () => {
    let fileContent = `module.exports='hello'`
    test('save', async () => {
        await file.save('a/1/2/3.js', fileContent)
        expect(require(Path.resolve('a/1/2/3.js'))).toBe('hello')
    })

    test('read', async () => {
        await expect(file.read('a/1/2/3.js')).resolves.toBe(fileContent)
        await file.rm('a')
    })
})

describe('isDirectory', () => {
    test('exists dir', async () => {
        FS.mkdirSync('a/1/2/3', { recursive: true })
        await expect(file.isDirectory('a/1/2/3')).resolves.toBeTruthy()
        FS.rmSync('a', { recursive: true })
    })

    test('not exists dir', async () => {
        await expect(file.isDirectory('a/1/2/3')).resolves.toBeFalsy()
        await expect(file.isDirectory('a/1/2')).resolves.toBeFalsy()
        await expect(file.isDirectory('a/1')).resolves.toBeFalsy()
        await expect(file.isDirectory('a')).resolves.toBeFalsy()
    })
})

describe('isFile', () => {
    test('exists dir', async () => {
        await file.save('a/1/2/3.txt', 'a-3')
        await expect(file.isFile('a/1/2/3.txt')).resolves.toBeTruthy()
        FS.rmSync('a/1/2/3.txt')
    })

    test('not exists dir', async () => {
        await expect(file.isFile('a/1/2/3.txt')).resolves.toBeFalsy()
    })
})

describe('copy', () => {
    async function init() {
        await file.save('a/1.txt', 'a_1')
        await file.save('a/2.txt', 'a_2')
    }

    async function clean() {
        await file.rm('a')
        await file.rm('b')
    }

    test('dir1 -> dir2', async () => {
        await init()
        await file.copy('a', 'b')
        expect(FS.existsSync('b/1.txt') && FS.existsSync('b/2.txt')).toBeTruthy()
        await clean()

        await init()
        await file.copy('a/', 'b/')
        expect(FS.existsSync('b/1.txt') && FS.existsSync('b/2.txt')).toBeTruthy()
        await clean()

        await init()
        await file.copy('a', 'b/')
        expect(FS.existsSync('b/a/1.txt') && FS.existsSync('b/a/2.txt')).toBeTruthy()
        await clean()
    })

    test('dir1/* -> dir2', async () => {
        await init()
        await file.copy('a/', 'b')
        expect(FS.existsSync('b/1.txt') && FS.existsSync('b/2.txt')).toBeTruthy()
        await clean()
    })

    test('file -> dir', async () => {
        await init()
        await file.copy('a/1.txt', 'b/')
        expect(FS.readFileSync('b/1.txt', 'utf-8')).toBe('a_1')

        await file.copy('a/1.txt', 'b/c/')
        expect(FS.readFileSync('b/c/1.txt', 'utf-8')).toBe('a_1')
        await clean()
    })

    test('file1 -> file2', async () => {
        await init()
        await file.copy('a/1.txt', 'b/x.txt')
        expect(FS.readFileSync('b/x.txt', 'utf-8')).toBe('a_1')

        await file.copy('a/1.txt', 'b/c/x.txt')
        expect(FS.readFileSync('b/c/x.txt', 'utf-8')).toBe('a_1')
        await clean()
    })

    test('copy to self', async () => {
        await init()
        await file.copy('a', 'a/backup/')
        expect(FS.readFileSync('a/backup/a/1.txt', 'utf-8')).toBe('a_1')
        await clean()

        await init()
        let n = Date.now()
        await file.copy('a', `a/backup/${n}`)
        expect(FS.readFileSync(`a/backup/${n}/1.txt`, 'utf-8')).toBe('a_1')
        await clean()
    })
})

describe('readdir', () => {
    async function init() {
        await file.save('a/1.txt', 'a_1')
        await file.save('a/c/2.txt', 'a_2')
        await file.mkdir('a/b')
        await file.mkdir('a/c/d')
    }

    test('no options', async () => {
        await init()
        await expect(file.readdir('a')).resolves.toEqual(['a/1.txt', 'a/b', 'a/c'])
    })

    test('all = true', async () => {
        await expect(file.readdir('a', { all: true })).resolves.toEqual(['a/1.txt', 'a/b', 'a/c/2.txt', 'a/c/d'])
    })

    test('onlyLeaf = false', async () => {
        await expect(file.readdir('a', { all: true, onlyLeaf: false })).resolves.toEqual([
            'a/1.txt',
            'a/b',
            'a/c',
            'a/c/2.txt',
            'a/c/d',
        ])
    })

    test('absolute = true', async () => {
        await expect(file.readdir('a', { absolute: true })).resolves.toEqual([
            Path.resolve('a/1.txt'),
            Path.resolve('a/b'),
            Path.resolve('a/c'),
        ])
    })

    test(`rebase = '/'`, async () => {
        await expect(file.readdir('a', { rebase: '/' })).resolves.toEqual(['/1.txt', '/b', '/c'])
    })

    test(`rebase = false`, async () => {
        await expect(file.readdir('a', { rebase: false })).resolves.toEqual(['1.txt', 'b', 'c'])
    })

    test(`filter`, async () => {
        await file.save('a/imgs/1.png', 'a_1')
        await file.save('a/c/imgs/2.jpg', 'a_2')
        await file.save('a/c/imgs/3.gif', 'a_3')
        await expect(file.readdir('a', { all: true, filter: '*.(jpg|png|gif)' })).resolves.toEqual([
            'a/imgs/1.png',
            'a/c/imgs/3.gif',
            'a/c/imgs/2.jpg',
        ])

        await expect(file.readdir('a', { all: true, filter: /.(jpg|png|gif)$/ })).resolves.toEqual([
            'a/imgs/1.png',
            'a/c/imgs/3.gif',
            'a/c/imgs/2.jpg',
        ])

        await expect(file.readdir('a', { all: true, filter: ['*.jpg', '*.gif', '*.png'] })).resolves.toEqual([
            'a/imgs/1.png',
            'a/c/imgs/3.gif',
            'a/c/imgs/2.jpg',
        ])

        await expect(
            file.readdir('a', { all: true, filter: p => ['.png', '.jpg', '.gif'].includes(Path.extname(p)) })
        ).resolves.toEqual(['a/imgs/1.png', 'a/c/imgs/3.gif', 'a/c/imgs/2.jpg'])
    })

    test(`ignore`, async () => {
        await file.save('a/c/imgs/4.png', 'a_4')
        await expect(file.readdir('a/c/imgs', { all: true, ignore: '*.(jpg|png)' })).resolves.toEqual([
            'a/c/imgs/3.gif',
        ])

        await expect(file.readdir('a/c/imgs', { all: true, ignore: /.(jpg|png)$/ })).resolves.toEqual([
            'a/c/imgs/3.gif',
        ])

        await expect(file.readdir('a/c/imgs', { all: true, ignore: ['*.jpg', '*.png'] })).resolves.toEqual([
            'a/c/imgs/3.gif',
        ])

        await expect(
            file.readdir('a/c/imgs', { all: true, ignore: p => ['.png', '.jpg'].includes(Path.extname(p)) })
        ).resolves.toEqual(['a/c/imgs/3.gif'])
    })

    test(`ignore`, async () => {
        await expect(file.readdir('a/imgs', { returnObj: true })).resolves.toEqual([
            {
                name: '1.png',
                path: 'a/imgs/1.png',
                isFile: true,
                isDirectory: false,
                isSymbolicLink: false,
                type: 1,
            },
        ])
        await file.rm('a')
    })
})

describe('isPath', () => {
    test('', async () => {
        await expect(file.isPath('a/1/2/3.txt')).resolves.toBe(true)
        await expect(file.isPath('a/1/2/3')).resolves.toBe(true)
        await expect(file.isPath('./a/1/2/3.txt')).resolves.toBe(true)
        await expect(file.isPath('.')).resolves.toBe(true)
        await expect(file.isPath('')).resolves.toBe(false)
        await expect(file.isPath('file://a/b')).resolves.toBe(false)
        await expect(file.isPath('/a')).resolves.toBe(true)
        await expect(file.isPath('./a')).resolves.toBe(true)
        await expect(file.isPath('../../../')).resolves.toBe(true)
        await expect(file.isPath('../a/../')).resolves.toBe(true)
        await expect(file.isPath('//a')).resolves.toBe(true)
        await expect(file.isPath('http://a')).resolves.toBe(false)
    })
})

describe('isSymbolicLink', () => {
    test('', async () => {
        await file.mkdir('a')
        FS.symlinkSync('a', 'b')
        await expect(file.isSymbolicLink('b')).resolves.toBe(true)
        await file.rm('a')
        await file.rm('b')
    })
})

describe('gitignoreParse', () => {
    test('', async () => {
        await expect(file.gitignoreParse('.gitignore')).resolves.toEqual([
            '.*',
            '!.gitignore',
            '/node_modules/',
            '*lock.json',
        ])
        await expect(file.gitignoreParse('.gitignore', true)).resolves.toEqual([
            /\.[^/*]+/i,
            /(\/!\.gitignore\/)|(\/!\.gitignore$)/i,
            /^\/node_modules\/$/i,
            /[^/*]+lock\.json/i,
        ])
    })
})
