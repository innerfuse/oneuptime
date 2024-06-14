import DataMigrations from "../DataMigrations/Index";
import OneUptimeDate from "Common/Types/Date";
import { PromiseVoidFunction } from "Common/Types/FunctionTypes";
import DataMigrationService from "CommonServer/Services/DataMigrationService";
import logger from "CommonServer/Utils/Logger";
import DataMigration from "Model/Models/DataMigration";

const RunDatabaseMigrations: PromiseVoidFunction = async (): Promise<void> => {
  for (const migration of DataMigrations) {
    try {
      // check if this migration has already been run
      const existingMigration: DataMigration | null =
        await DataMigrationService.findOneBy({
          query: {
            name: migration.name,
            executed: true,
          },
          props: {
            isRoot: true,
          },
        });

      if (existingMigration) {
        logger.debug("Skipping Database Migration:" + migration.name);
        continue;
      }

      logger.debug("Running Database Migration:" + migration.name);

      await migration.migrate();

      logger.debug("Database Migration Complete:" + migration.name);

      // add it to the database.
      const dataMigration: DataMigration = new DataMigration();
      dataMigration.name = migration.name;
      dataMigration.executed = true;
      dataMigration.executedAt = OneUptimeDate.getCurrentDate();

      await DataMigrationService.create({
        data: dataMigration,
        props: {
          isRoot: true,
        },
      });
    } catch (err) {
      logger.error("Database Migration Failed:" + migration.name);
      logger.error(err);
      logger.debug("Rolling back Database Migration:" + migration.name);

      try {
        await migration.rollback();
      } catch (err) {
        logger.error("Database Migration Rollback Failed:" + migration.name);
        logger.error(err);
      }

      break; // Stop running migrations
    }
  }
};

export default RunDatabaseMigrations;
