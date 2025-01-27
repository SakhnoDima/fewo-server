import { STATUS } from "../constants/index.js";
import TaskSchedulerService from "../services/TaskSchedulerService.js";

const scrappingScheduler = new TaskSchedulerService();

export const addUrl = (req, res) => {
  const { url, location } = req.body;

  if (!location || !url) {
    return res.status(400).json({
      status: STATUS.error,
      message: `Required filed is not provided!`,
    });
  }

  if (!scrappingScheduler.tasks[location]) {
    scrappingScheduler.addUrl(location, url);
    return res.status(200).json({
      status: STATUS.success,
      message: `Scraping for ${location} started!`,
    });
  } else {
    return res.status(400).json({
      status: STATUS.error,
      message: `Scraping for ${location} was already started!`,
    });
  }
};

export const removeUrl = (req, res) => {
  const { location } = req.body;

  if (!location) {
    return res.status(400).json({
      status: STATUS.error,
      message: `Required filed is not provided!`,
    });
  }

  if (scrappingScheduler.tasks[location]) {
    scrappingScheduler.removeUrl(location);
    return res.status(200).json({
      status: STATUS.success,
      message: `Scraping for ${location} was stopped!`,
    });
  } else {
    return res.status(400).json({
      status: STATUS.error,
      message: `Scraping for ${location} was already removed!`,
    });
  }
};
