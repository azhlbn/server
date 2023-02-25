import express from "express";
import mongoose from "mongoose";
import cors from "cors";

mongoose.set("strictQuery", false);

await mongoose.connect("mongodb://localhost/rsd");

const Schema = mongoose.Schema;

const txRecord = new Schema({
  wallet: String,
  receiver: String,
  amount: String,
  approvers: Array,
  sigs: Array
});

const TxRecord = new mongoose.model("TransactionRecord", txRecord);

var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.get("/", async (req, res) => {
  const records = await TxRecord.find();
  if (!records || records.length == 0) {
    return res.status(404).send({ error: "No any txs" });
  }
  res.send({ records });
});

app.get("/get_records_by_wallet/:wallet", async (req, res) => {
  try {
    const record = await TxRecord.find({ wallet: req.params.wallet });
    if (!record) {
      return res.status(404).send({ error: "Ничего не найдено" });
    }
    res.send({ record });
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

app.get("/get_approves_by_id/:id", async (req, res) => {
  try {
    const record = await TxRecord.find({ _id: req.params.id });
    if (!record) {
      return res.status(404).send({ error: "Ничего не найдено" });
    }
    res.send({ record });
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

app.post("/", async (req, res) => {
  const { wallet, receiver, amount, approvers, sigs } = req.body;

  if (!wallet || !receiver || !amount || !sigs) {
    return res.status(403).send({ error: "Нужно отправить и хэш и текст." });
  }
  const record = new TxRecord({ wallet, receiver, amount, approvers, sigs });
  try {
    await record.save();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
  res.send({ record });
});

app.post("/update_approvers", async (req, res) => {
  const { id, sigsToSend, approvers } = req.body;

  if (!id || !approvers || !sigsToSend) {
    return res.status(403).send({ error: "Нужно отправить и апруверов и кошелек" });
  }
  try {
    const record = await TxRecord.updateOne({ _id: id }, { $set: { approvers: approvers, sigs: sigsToSend }});
    if (!record) {
      return res.status(404).send({ error: "Ничего не найдено" });
    }
    res.send({ record });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
