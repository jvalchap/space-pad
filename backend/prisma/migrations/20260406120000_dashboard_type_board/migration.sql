-- Collapse DashboardType to DEFAULT | BOARD (map legacy values to DEFAULT).

ALTER TABLE "Dashboard" ALTER COLUMN "type" DROP DEFAULT;

ALTER TABLE "Dashboard"
  ALTER COLUMN "type" TYPE TEXT
  USING ("type"::TEXT);

UPDATE "Dashboard" SET "type" = CASE WHEN "type" = 'BOARD' THEN 'BOARD' ELSE 'DEFAULT' END;

DROP TYPE "DashboardType";

CREATE TYPE "DashboardType" AS ENUM ('DEFAULT', 'BOARD');

ALTER TABLE "Dashboard"
  ALTER COLUMN "type" TYPE "DashboardType"
  USING ("type"::"DashboardType");

ALTER TABLE "Dashboard" ALTER COLUMN "type" SET DEFAULT 'DEFAULT';
