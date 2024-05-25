const express = require('express');
const mongoose = require('mongoose');
require("./db/config");
const cors = require('cors');
const app = express();
const Product = require("./db/products");
app.use(express.json());
app.use(cors());

// GET DATA FROM MONGODB ATLAS
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// API FOR SEARCH
app.get("/search/:key", async (req, res) => {
  const key = req.params.key;
  const floatKey = parseFloat(key);

  // Check if floatKey is a valid number
  const isNumber = !isNaN(floatKey);

  const searchCriteria = {
    "$or": [
      { description: { $regex: key, $options: 'i' } },
      { title: { $regex: key, $options: 'i' } }
    ]
  };

  // If key is a valid number, include price in the search criteria
  if (isNumber) {
    searchCriteria["$or"].push({ price: floatKey });
  }

  try {
    const result = await Product.find(searchCriteria);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: 'An error occurred while searching for products.' });
  }
});


// API FOR STATISTICS BASED ON MONTH
app.get('/stats/:month', async (req, res) => {
  try {
    const month = req.params.month;
    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const monthIndex = new Date(`${month} 1, 2000`).getMonth();
    
    const products = await Product.find();
    
    const filteredProducts = products.filter(product => {
      const saleMonth = new Date(product.dateOfSale).getMonth();
      return saleMonth === monthIndex;
    });

    const totalSaleAmount = filteredProducts.reduce((acc, product) => acc + product.price, 0);
    const totalSoldItems = filteredProducts.filter(product => product.sold).length;
    const totalNotSoldItems = filteredProducts.length - totalSoldItems;

    res.json({ totalSaleAmount, totalSoldItems, totalNotSoldItems });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Filter products by month
app.get('/products/:month', async (req, res) => {
  try {
    const month = req.params.month;
    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }
    
    const monthIndex = new Date(`${month} 1, 2000`).getMonth();
    
    const products = await Product.find();
    const filteredProducts = products.filter(product => {
      const saleMonth = new Date(product.dateOfSale).getMonth();
      return saleMonth === monthIndex;
    });

    res.json(filteredProducts);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

const monthMapping = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
};


app.get('/bar-chart/:month', async (req, res) => {
  const monthParam = req.params.month.toLowerCase();
  const month = monthMapping[monthParam];

  if (month === undefined) {
    return res.status(400).send({ error: 'Invalid month parameter' });
  }

  try {
    const year = new Date().getFullYear();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    // Adjust end date for December
    if (month === 11) {
      endDate.setFullYear(year + 1, 0, 1);
    }

    console.log(`Start Date: ${startDate}, End Date: ${endDate}`); // Debugging

    const products = await Product.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
          default: "Other",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    console.log('Products:', products); // Debugging

    const result = [
      { range: "0-100", count: 0 },
      { range: "101-200", count: 0 },
      { range: "201-300", count: 0 },
      { range: "301-400", count: 0 },
      { range: "401-500", count: 0 },
      { range: "501-600", count: 0 },
      { range: "601-700", count: 0 },
      { range: "701-800", count: 0 },
      { range: "801-900", count: 0 },
      { range: "901-above", count: 0 }
    ];

    products.forEach(bucket => {
      const priceRange = bucket._id === "Other" ? "901-above" : `${bucket._id}-${bucket._id + 99}`;
      const rangeIndex = result.findIndex(range => range.range === priceRange);
      if (rangeIndex !== -1) {
        result[rangeIndex].count = bucket.count;
      }
    });

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'An error occurred while generating the bar chart data' });
  }
});

// Pie chart endpoint
app.get('/pie-chart/:month', async (req, res) => {
  const monthParam = req.params.month.toLowerCase();
  const month = monthMapping[monthParam];

  if (month === undefined) {
    return res.status(400).send({ error: 'Invalid month parameter' });
  }

  try {
    const products = await Product.aggregate([
      {
        $addFields: {
          dateOfSale: { $toDate: "$dateOfSale" }
        }
      },
      {
        $match: {
          $expr: { $eq: [{ $month: "$dateOfSale" }, month + 1] }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1
        }
      }
    ]);
    
    res.json(products);
  } catch (err) {
    console.error("Error generating pie chart data:", err);
    res.status(500).send({ error: 'An error occurred while generating the pie chart data' });
  }
});


app.listen(5000, () => {
  console.log('Example app listening at http://localhost:5000');
});
