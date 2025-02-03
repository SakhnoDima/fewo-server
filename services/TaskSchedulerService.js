import cron from "node-cron";
import dotenv from "dotenv";
import { ScrappingService } from "./scrapping/ScrappingService.js";

dotenv.config();

class TaskSchedulerService {
  #tasks;
  #mainTask;
  #schedule;
  #timezone;

  constructor(
    schedule = process.env.CRON_SCHEDULE,
    timezone = process.env.TIMEZONE
  ) {
    this.#tasks = {};
    this.#mainTask = null;
    this.#schedule = schedule;
    this.#timezone = timezone;
  }

  removeAllTasks() {
    this.#tasks = {};
  }

  getTask(location) {
    return this.#tasks[location] || null;
  }

  addUrl(location, url) {
    this.#tasks[location] = url;
    console.log(`Scrapper for ${location} added!`);
    console.log(this.#tasks);
    this.#manageCronJob();
  }

  removeUrl(location) {
    delete this.#tasks[location];
    console.log(`Scrapper for "${location}" removed!`);
    console.log(this.#tasks);
    this.#manageCronJob();
  }

  async #runTasksSequentially() {
    for (const key in this.#tasks) {
      const url = this.#tasks[key];
      try {
        console.log(`Running task: ${key}`);
        await ScrappingService(url);
      } catch (error) {
        console.error(`Error in task ${key}:`, error);
        console.log("CRAWLER ERROR! Check logs");
      }
    }
  }

  #manageCronJob() {
    if (Object.keys(this.#tasks).length > 0) {
      if (!this.#mainTask) {
        this.#mainTask = cron.schedule(
          this.#schedule,
          async () => {
            await this.#runTasksSequentially();
          },
          {
            timezone: this.#timezone,
          }
        );
        this.#mainTask.start();
        console.log("Cron started!");
      }
    } else {
      if (this.#mainTask) {
        this.#mainTask.stop();
        this.#mainTask = null;
        console.log("Cron stopped!");
      }
    }
  }
}

export default TaskSchedulerService;
