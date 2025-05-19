-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_cash_register_id_fkey";

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_register"("id") ON DELETE CASCADE ON UPDATE CASCADE;
