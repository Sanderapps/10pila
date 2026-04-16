ALTER TABLE "Address" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

WITH ranked_addresses AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
    ) AS row_number
  FROM "Address"
)
UPDATE "Address" AS address
SET "isDefault" = true
FROM ranked_addresses
WHERE address."id" = ranked_addresses."id"
  AND ranked_addresses.row_number = 1;

CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");
