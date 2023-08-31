const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const AES = require("crypto-js/aes");
const Utf8 = require('crypto-js/enc-utf8');

const SECRET_KEY = "harekrishnaharekrishnakrishnakrishnaharehare";

const encrypt = (text) => {
  const encrypted = AES.encrypt(text, SECRET_KEY);
  return encrypted.toString();
};

const decrypt = (encryptedText) => {
  const decrypted = AES.decrypt(encryptedText, SECRET_KEY);
  return decrypted.toString(Utf8);
};

const corsOptions = {
  origin: '*',
  Credentials: true,
  optionsSuccessStatus: 200
};

const app = express();
const port = 3001;
const url = 'mongodb://exploreadmin:harekrishna@0.0.0.0:27018/exploredb?authMechanism=DEFAULT&authSource=exploredb';

app.use(express.json());
app.use(cors(corsOptions));

app.get('/members', async (req, res) => {
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const eddmembers = db.collection('eddmembers');
    const results = await eddmembers.find().toArray();
    console.log(results);
    res.send(results).status(200);
  } catch (err) {
    console.log(err);
  } finally {
    console.log('MongoDB connection closed');
    client.close();
  }
});

app.post('/addvisit', async (req, res) => {
  const visitDetails = req.body;
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const visitsCollection = db.collection('visits');
    const result = await visitsCollection.insertOne(visitDetails);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
    res.send(result).status(200);
  } catch (err) {
    console.log(err);
  } finally {
    console.log('MongoDB connection closed...');
    client.close();
  }
});

app.post('/signup', async (req, res) => {
  const userDetails = req.body;
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const usersCollection = db.collection('users');
    const result = await usersCollection.insertOne(userDetails);
    const message = `User with _id: ${result.insertedId} was successfully registered.`;
    console.log(`User with _id: ${result.insertedId} was successfully registered.`);
    res.status(200).json({message: message, id: result.insertedId});
  } catch (err) {
    console.log(err);
  } finally {
    console.log('MongoDB connection closed...');
    client.close();
  }
});

app.post('/login', async (req, res) => {
  const { cpf, password } = req.body;
  const originalPassword = decrypt(password);
  console.log('Original: ', originalPassword);
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const usersCollection = db.collection('users');
    const result = await usersCollection.findOne({cpf: cpf});
    const userDecryptedPassword = decrypt(result.password);
    console.log('Saved Decrypted: ', userDecryptedPassword);
    if (originalPassword === userDecryptedPassword) {
      console.log('Babba Re!');
    }
    // const message = `User with _id: ${result.insertedId} was successfully registered.`;
    // console.log(`User with _id: ${result.insertedId} was successfully registered.`);
    // res.status(200).json({message: message, id: result.insertedId});
    res.status(200).json({message: 'Message!'});
  } catch (err) {
    console.log(err);
  } finally {
    console.log('MongoDB connection closed...');
    client.close();
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});