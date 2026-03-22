-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('LOCAL', 'DROPSHIPPING');

-- AlterTable: drop default first, change type, then restore default
ALTER TABLE "Product" ALTER COLUMN "fulfillmentType" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "fulfillmentType" TYPE "FulfillmentType" USING "fulfillmentType"::"FulfillmentType";
ALTER TABLE "Product" ALTER COLUMN "fulfillmentType" SET DEFAULT 'LOCAL'::"FulfillmentType";
