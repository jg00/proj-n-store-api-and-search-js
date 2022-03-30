const Product = require("../models/product");

// testing only
const getAllProductsStatic = async (req, res) => {
  const products = await Product.find({ price: { $gt: 30 } })
    .sort("price")
    .select("name price");

  res.status(200).json({ nbHits: products.length, products });
};

const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query;
  const queryObject = {}; // all

  // filters
  if (featured) {
    queryObject.featured = featured === "true" ? true : false;
  }
  if (company) {
    queryObject.company = company;
  }
  if (name) {
    queryObject.name = { $regex: name, $options: "i" }; // { name: { '$regex': 'emp', '$options': 'i' } }
  }
  if (numericFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const regEx = /\b(<|>|>=|=|<=)\b/g;
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );

    // console.log(numericFilters); // price>40,rating>=4
    // console.log(filters); // price-$gt-40,rating-$gte-4

    const options = ["price", "rating"];
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-");
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) };
      }
    });

    // queryObject => { price: { '$gt': 40 }, rating: { '$gte': 4 } }
  }

  // console.log(queryObject);
  let result = Product.find(queryObject);

  // cursor sort
  if (sort) {
    const sortList = sort.split(",").join(" "); // name -price
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }

  // select
  if (fields) {
    const fieldsList = fields.split(",").join(" "); // name price
    result = result.select(fieldsList);
  }

  // cursor limit, skip
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const products = await result;
  res.status(200).json({ nbHits: products.length, products });
};

module.exports = { getAllProducts, getAllProductsStatic };

/*
db.collection.find()
Returns:	A cursor to the documents that match the query criteria. When the find() method "returns documents," 
the method is actually returning a cursor to the documents.

cursor: A pointer to the result set of a query.

In MongoDB, the find() method return the cursor, now to access the document we need to iterate the cursor. In the mongo shell, 
if the cursor is not assigned to a var keyword then the mongo shell automatically iterates the cursor up to 20 documents. 
MongoDB also allows you to iterate cursor manually. So, to iterate a cursor manually simply assign the cursor return by the 
find() method to the var keyword Or JavaScript variable.

Chained methods like sort() and limit() set some of the options used to construct a "query cursor", and a subset of document 
fields can be specified in the query projection.

These methods modify the way that the underlying query is executed.
*/
