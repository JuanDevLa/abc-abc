/*
  Warnings:

  - Changed the type of `shippingMethod` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "trackingNumber" VARCHAR(100),
DROP COLUMN "shippingMethod",
ADD COLUMN     "shippingMethod" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ShippingMethod";
