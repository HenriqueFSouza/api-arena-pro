-- CreateTable
CREATE TABLE "cash_register" (
    "id" TEXT NOT NULL,
    "openedAmount" DOUBLE PRECISION NOT NULL,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "closedAmount" DOUBLE PRECISION,
    "owner_id" TEXT NOT NULL,
    "registeredPayments" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "cash_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "cash_register_id" TEXT NOT NULL,
    "origin_id" TEXT,
    "origin_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cash_register" ADD CONSTRAINT "cash_register_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_register"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
