import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const verifiedCount = await prisma.review.count({
    where: { verified: true }
  })
  const totalCount = await prisma.review.count()
  console.log(`Verified Reviews: ${verifiedCount}`)
  console.log(`Total Reviews: ${totalCount}`)
  
  const sample = await prisma.review.findMany({
    where: { verified: true },
    take: 5,
    select: { name: true, comment: true, image: true }
  })
  console.log('Sample verified reviews:', JSON.stringify(sample, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
