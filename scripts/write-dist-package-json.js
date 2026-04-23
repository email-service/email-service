// Écrit un package.json minimal dans dist/<variant>/ pour que Node identifie
// correctement le type de module (ESM vs CJS) du build, indépendamment du
// package.json racine. Nécessaire parce que le projet émet les deux variantes
// et que sans ce marqueur Node réémet un warning MODULE_TYPELESS_PACKAGE_JSON
// et reparse les fichiers .js comme ESM en fallback (perf overhead).
//
// Usage : node scripts/write-dist-package-json.js {esm|cjs}

const { writeFileSync } = require('node:fs')
const { join } = require('node:path')

const variant = process.argv[2]
if (!['esm', 'cjs'].includes(variant)) {
	console.error('Usage: node scripts/write-dist-package-json.js {esm|cjs}')
	process.exit(1)
}

const type = variant === 'esm' ? 'module' : 'commonjs'
const target = join('dist', variant, 'package.json')
writeFileSync(target, JSON.stringify({ type }, null, 2) + '\n')
console.log(`wrote ${target} ({ "type": "${type}" })`)
