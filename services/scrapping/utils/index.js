import axios from "axios";

export async function getExchangeRate(targetCurrency) {
  const apiKey = "648fe9bf254397788968dc604223d94d";
  const url = `https://api.exchangeratesapi.io/v1/latest?access_key=${apiKey}&symbols=${targetCurrency}`;

  try {
    const response = await axios.get(url);

    if (response.data.error) {
      throw new Error(`API Error: ${response.data.error.info}`);
    }

    return response.data.rates[targetCurrency];
  } catch (error) {
    console.error(
      "Error in getExchangeRate",
      error.response?.data || error.message
    );
  }
}
