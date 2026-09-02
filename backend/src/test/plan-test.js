import { planWebsite } from '../planner.js'

const prompt = process.argv[2] || 'Build a premium jewellery ecommerce website for Silver Article'

console.time('plan')
try {
  const result = await planWebsite(prompt)
  console.timeEnd('plan')
  console.log(JSON.stringify(result, null, 2))
} catch (err) {
  console.timeEnd('plan')
  console.error('PLAN FAILED')
  console.error(`  code:    ${err.code ?? 'INTERNAL'}`)
  console.error(`  message: ${err.message ?? String(err)}`)
  process.exit(1)
}