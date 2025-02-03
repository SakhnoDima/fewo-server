import { STATUS } from "../constants/index.js";
import TaskSchedulerService from "../services/TaskSchedulerService.js";

const scrappingScheduler = new TaskSchedulerService();

export const addUrl = (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      status: STATUS.error,
      message: "Request body must be an array of objects",
    });
  }

  const results = [];

  scrappingScheduler.removeAllTasks();

  req.body.forEach((element) => {
    const { location, url, status } = element;

    if (!location || !url || typeof status === "undefined") {
      results.push({
        location: location || "unknown",
        status: "error",
        message: "Some of required fields is empty",
      });
      return;
    }

    const existingLocation = scrappingScheduler.getTask(location);

    if (!status && existingLocation) {
      scrappingScheduler.removeUrl(location);
      results.push({
        location,
        status: STATUS.success,
        message: `Scraping for ${location} stopped!`,
      });
    } else if (status && !existingLocation) {
      scrappingScheduler.addUrl(location, url);
      results.push({
        location,
        status: STATUS.success,
        message: `Scraping for ${location} started!`,
      });
    } else {
      results.push({
        location,
        status: STATUS.success,
        message: `Scraping for ${location} without changing!`,
      });
    }
  });

  return res.status(200).json({
    status: STATUS.success,
    results,
  });
};

// export const removeUrl = (req, res) => {
//   const { location } = req.body;

//   if (!location) {
//     return res.status(400).json({
//       status: STATUS.error,
//       message: `Required filed is not provided!`,
//     });
//   }

//   if (scrappingScheduler.tasks[location]) {
//     scrappingScheduler.removeUrl(location);
//     return res.status(200).json({
//       status: STATUS.success,
//       message: `Scraping for ${location} was stopped!`,
//     });
//   } else {
//     return res.status(400).json({
//       status: STATUS.error,
//       message: `Scraping for ${location} was already removed!`,
//     });
//   }
// };
