-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "order_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
