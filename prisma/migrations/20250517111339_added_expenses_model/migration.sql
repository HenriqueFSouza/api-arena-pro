-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
