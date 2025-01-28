import axios from "axios";
import FormData from "form-data";
import { delayer } from "../../assistants/helpers.js";
import { getExchangeRate } from "./utils/index.js";

const urlList = {
  germany: "https://www.hometogo.de/search/5460aecab790d",

  balticSea: "https://www.hometogo.de/search/5460aeb204e17",

  northSea: "https://www.hometogo.de/search/5460aecb5d3a1",

  italy: "https://www.hometogo.de/search/5460aeae078f7",

  croatia: "https://www.hometogo.de/search/5460aeaaa3139",

  netherlands: "https://www.hometogo.de/search/5460aed303689",

  denmark: "https://www.hometogo.de/search/5460aeb07b41a",

  spain: "https://www.hometogo.de/search/5460aeae487f8",
};

// Get all ids, we always have 300 items
const getHomeList = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
      },
    });
    return response.data.offers.map(({ id }) => id);
  } catch (error) {
    console.log("Error in getHomeList", error.response?.data || error.message);
  }
};

// Get home details by id
const getHomeDetails = async (id) => {
  const url = "https://www.hometogo.de/searchdetails/5460aecab790d";
  const formData = new FormData();

  formData.append("offers", id);

  try {
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    return response.data.offers[0];
  } catch (error) {
    console.error(
      "Error in getHomeDetails:",
      error.response?.data || error.message
    );
  }
};

// Get guests reviews by house id
const getReviewsById = async (id) => {
  const url = `https://www.hometogo.de/reviews/list/${id}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
      },
    });

    return response.data.list
      .map((item) => {
        if (
          !item.nickname ||
          item.nickname.trim().length === 0 ||
          !item.rating?.value ||
          !item.text ||
          item.text.trim().length === 0
        ) {
          return "";
        } else
          return `guestName: ${item.nickname}, starRating: ${item.rating.value}, reviewText: ${item.text}`;
      })
      .filter(Boolean)
      .join("; ");
  } catch (error) {
    console.log(
      `Error in getReviewsById with ${id}`,
      error.response?.data || error.message
    );
  }
};

export const ScrappingService = async (url) => {
  const exchangeRate = await getExchangeRate("USD");
  console.log("Rate:", exchangeRate);

  const homesIdList = await getHomeList(url);
  console.log("Total homes found:", homesIdList.length);

  try {
    if (homesIdList.length > 0) {
      for (let i = 0; i < 1; i++) {
        //! dont forget to change
        console.log(i);
        const info = await getHomeDetails(homesIdList[i]);
        // console.log(info);
        const itemData = {
          Id: homesIdList[i],
        };

        itemData["Primary Title"] = info.unitTitle;
        itemData["Secondary Title"] = info.secondaryTitle;
        itemData["Description"] = info.description.unit.content;
        itemData["Price per Night"] = Math.round(
          Math.round(info.price.rawPrice) / exchangeRate
        );
        itemData["Location"] = info.locationTrailHeading.details;
        itemData[
          "Coordinates"
        ] = `${info.geoLocation.lat},  ${info.geoLocation.lon}`;

        itemData["Location Details"] = info.infoGroups
          .find((group) => group.title === "In der Nähe")
          .list.map((item) => {
            if (item.icon) {
              return `label: ${item.label}, icon : ${item.icon}`;
            }
            return `label: ${item.label}`;
          })
          .join("; ");

        itemData["Benefits"] = info.salesArguments
          .filter((item) => item.slot === 10000000)
          .map((item) => {
            if (
              item.props.icon ||
              item.props.label ||
              item.props.propertyHighlightText
            ) {
              return `icon: ${item.props.icon}, label: ${item.props.label}, text: ${item.props.propertyHighlightText}`;
            } else return "";
          })
          .filter(Boolean)
          .join("; ");

        itemData["Image URLs"] = info.images
          .map(({ large }) => `https:${large}`)
          .join("; ");

        let equipment = [];
        info.infoGroups.map((group) => {
          if (
            group.title === "Wichtige Ausstattung" ||
            group.title === "Außenbereiche"
          ) {
            group.list.forEach((item) => {
              equipment.push(`label: ${item.label}, icon: ${item.icon}`);
            });
          }
        });
        itemData["Equipment"] = equipment.join("; ");

        // get reviews
        itemData["Reviews"] = await getReviewsById(homesIdList[i]);

        //get rooms details
        if (info.rooms.length > 0) {
          itemData["Rooms"] = info.rooms
            .map((room) => {
              if (
                !room.roomType ||
                !room.beds ||
                !room.properties ||
                !room.icons
              ) {
                return "";
              } else
                return `title:${room.roomType}, properties: ${[
                  ...room.beds,
                  ...room.properties,
                ]}, icons: ${room.icons}`;
            })
            .join("; ");
        }
        console.log(itemData); // send data to the site

        await delayer(1000);
      }
    }
  } catch (error) {
    console.log("Error in main:", error.response?.data || error.message);
  }
};

//ScrappingService("https://www.hometogo.de/search/5460aecab790d");
