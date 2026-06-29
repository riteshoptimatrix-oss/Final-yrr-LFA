==========================================
MONGODB COMMANDS REFERENCE
==========================================

------------------------------------------
DATABASE COMMANDS
------------------------------------------

Show all databases
show dbs

Switch to / create a database
use myDatabase

Show current database
db

Drop current database
db.dropDatabase()

Show database stats
db.stats()


------------------------------------------
COLLECTION COMMANDS
------------------------------------------

Show all collections
show collections

Create a collection
db.createCollection("myCollection")

Drop a collection
db.myCollection.drop()

Rename a collection
db.myCollection.renameCollection("newCollectionName")

Collection stats
db.myCollection.stats()


------------------------------------------
INSERT COMMANDS
------------------------------------------

Insert one document
db.myCollection.insertOne({ name: "Alice", age: 25 })

Insert multiple documents
db.myCollection.insertMany([
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 35 }
])


------------------------------------------
QUERY / FIND COMMANDS
------------------------------------------

Find all documents
db.myCollection.find()

Find with pretty print
db.myCollection.find().pretty()

Find one document
db.myCollection.findOne({ name: "Alice" })

Find with condition
db.myCollection.find({ age: { $gt: 25 } })

Find with projection (include fields)
db.myCollection.find({}, { name: 1, age: 1, _id: 0 })

Find with limit
db.myCollection.find().limit(5)

Find with skip
db.myCollection.find().skip(10)

Find with sort (1 = ascending, -1 = descending)
db.myCollection.find().sort({ age: 1 })

Count documents
db.myCollection.countDocuments({ age: { $gt: 25 } })

Distinct values
db.myCollection.distinct("name")


------------------------------------------
UPDATE COMMANDS
------------------------------------------

Update one document
db.myCollection.updateOne(
  { name: "Alice" },
  { $set: { age: 26 } }
)

Update multiple documents
db.myCollection.updateMany(
  { age: { $lt: 30 } },
  { $set: { status: "young" } }
)

Replace a document
db.myCollection.replaceOne(
  { name: "Alice" },
  { name: "Alice", age: 27, city: "NYC" }
)

Upsert (update or insert if not exists)
db.myCollection.updateOne(
  { name: "Dave" },
  { $set: { age: 40 } },
  { upsert: true }
)

Increment a field
db.myCollection.updateOne({ name: "Alice" }, { $inc: { age: 1 } })

Rename a field
db.myCollection.updateOne({ name: "Alice" }, { $rename: { age: "years" } })

Remove a field
db.myCollection.updateOne({ name: "Alice" }, { $unset: { status: "" } })

Add item to array
db.myCollection.updateOne({ name: "Alice" }, { $push: { hobbies: "reading" } })

Add unique item to array
db.myCollection.updateOne({ name: "Alice" }, { $addToSet: { hobbies: "coding" } })

Remove item from array
db.myCollection.updateOne({ name: "Alice" }, { $pull: { hobbies: "reading" } })


------------------------------------------
DELETE COMMANDS
------------------------------------------

Delete one document
db.myCollection.deleteOne({ name: "Alice" })

Delete multiple documents
db.myCollection.deleteMany({ age: { $lt: 25 } })

Delete all documents in collection
db.myCollection.deleteMany({})


------------------------------------------
QUERY OPERATORS
------------------------------------------

Comparison
db.myCollection.find({ age: { $eq: 25 } })   equal
db.myCollection.find({ age: { $ne: 25 } })   not equal
db.myCollection.find({ age: { $gt: 25 } })   greater than
db.myCollection.find({ age: { $gte: 25 } })  greater than or equal
db.myCollection.find({ age: { $lt: 25 } })   less than
db.myCollection.find({ age: { $lte: 25 } })  less than or equal
db.myCollection.find({ age: { $in: [25, 30, 35] } })   in array
db.myCollection.find({ age: { $nin: [25, 30] } })      not in array

Logical
db.myCollection.find({ $and: [{ age: { $gt: 20 } }, { age: { $lt: 40 } }] })
db.myCollection.find({ $or: [{ age: 25 }, { age: 30 }] })
db.myCollection.find({ age: { $not: { $gt: 30 } } })
db.myCollection.find({ $nor: [{ age: 25 }, { age: 30 }] })

Element
db.myCollection.find({ phone: { $exists: true } })   field exists
db.myCollection.find({ age: { $type: "int" } })      field type

Evaluation
db.myCollection.find({ name: { $regex: /^A/ } })     regex match
db.myCollection.find({ $where: "this.age > 25" })    JavaScript expression
db.myCollection.find({ name: { $text: { $search: "Alice" } } })  text search

Array
db.myCollection.find({ hobbies: { $all: ["reading", "coding"] } })  all elements match
db.myCollection.find({ hobbies: { $size: 3 } })                     array size
db.myCollection.find({ "hobbies.0": "reading" })                    element at index


------------------------------------------
AGGREGATION PIPELINE
------------------------------------------

db.myCollection.aggregate([

  Match (filter)
  { $match: { age: { $gt: 20 } } },

  Group
  { $group: { _id: "$city", totalUsers: { $sum: 1 }, avgAge: { $avg: "$age" } } },

  Sort
  { $sort: { totalUsers: -1 } },

  Limit
  { $limit: 5 },

  Skip
  { $skip: 2 },

  Project (reshape documents)
  { $project: { name: 1, age: 1, _id: 0 } },

  Unwind (deconstruct array)
  { $unwind: "$hobbies" },

  Lookup (join)
  {
    $lookup: {
      from: "orders",
      localField: "_id",
      foreignField: "userId",
      as: "userOrders"
    }
  },

  Add fields
  { $addFields: { fullName: { $concat: ["$firstName", " ", "$lastName"] } } },

  Count
  { $count: "totalCount" },

  Facet (multiple pipelines)
  {
    $facet: {
      byAge: [{ $group: { _id: "$age", count: { $sum: 1 } } }],
      byCity: [{ $group: { _id: "$city", count: { $sum: 1 } } }]
    }
  }
])


------------------------------------------
INDEX COMMANDS
------------------------------------------

Create single field index
db.myCollection.createIndex({ name: 1 })

