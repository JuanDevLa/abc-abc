CREATE INDEX IF NOT EXISTS "Club_leagueId_idx" ON "Club"("leagueId");
CREATE INDEX IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_variantId_idx" ON "PurchaseOrderItem"("variantId");
CREATE INDEX IF NOT EXISTS "RewardTransaction_orderId_idx" ON "RewardTransaction"("orderId");
