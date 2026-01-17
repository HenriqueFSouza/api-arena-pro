-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillRecurrence" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "recurrence" "BillRecurrence" NOT NULL DEFAULT 'NONE',
    "recurrence_parent_id" TEXT,
    "expense_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_recurrence_parent_id_fkey" FOREIGN KEY ("recurrence_parent_id") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
