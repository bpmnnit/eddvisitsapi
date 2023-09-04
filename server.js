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

app.get('/list', async (req, res) => {
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const eddmembers = db.collection('visits');
    const results = await eddmembers.find().sort({requestedOn: -1}).toArray();
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
  console.log(visitDetails);
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const visitsCollection = db.collection('visits');
    const result = await visitsCollection.insertOne(visitDetails);
    const message = 'Request Accepted. Approval Awaited.';
    console.log(`A visit was inserted with the _id: ${result.insertedId}`);
    res.status(200).json({message: message, id: result.insertedId, severity: 'success'});
  } catch (err) {
    console.log(err);
  } finally {
    console.log('MongoDB connection closed...');
    client.close();
  }
});

app.post('/signup', async (req, res) => {
  const userDetails = req.body;
  const cpf = userDetails.cpf;
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const usersCollection = db.collection('users');
    const existingCpf = await usersCollection.findOne({cpf: cpf});
    if (existingCpf === null) {
      const result = await usersCollection.insertOne(userDetails);
      const message = `User successfully registered.`;
      console.log(`User with _id: ${result.insertedId} was successfully registered.`);
      res.status(200).json({message: message, id: result.insertedId, severity: 'success'});
    } else {
      const message = `User with CPF: ${cpf} already exists.`;
      res.status(403).json({message: message, severity: 'error'});
    }
  } catch (err) {
    console.log(err);
  } finally {
    console.log('MongoDB connection closed...');
    client.close();
  }
});

const getVisitsByCpf = async (db, cpf, password) => {
  const originalPassword = decrypt(password);
  const usersCollection = db.collection('users');
  const visitee = await usersCollection.findOne({cpf: +cpf});
  const userDecryptedPassword = decrypt(visitee.password);
  if (originalPassword === userDecryptedPassword) {
    const visitsCollection = db.collection('visits');
    const visitRequests = await visitsCollection.find({cpf: cpf}).next();
    return visitRequests;
  }
};

app.post('/login', async (req, res) => {
  const { cpf, password } = req.body;
  const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
  if (!client) {
    console.log('Somehow not connected to the database!');
    return;
  }
  try {
    const db = client.db("exploredb");
    const visitRequests = await getVisitsByCpf(db, cpf, password);
    if (visitRequests !== undefined || visitRequests !== null) {
      const message = `Visit requests for CPF: ${cpf} are being returned.`;
      res.status(200).json({message: message, visitRequests: visitRequests, severity: 'success'});
    } else {
      const message = `User not found OR Invalid login credentials.`;
      res.status(403).json({message: message, severity: 'error'});
    }
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