require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { getCurrentRound, allowedWord } = require("./db");
const { newRound } = require("./cron");

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.use("/cron", newRound);

app.get("/", (req, res) => {
  res.json({ success: true });
});

app.get("/api/word", async (req, res) => {
  console.log("GET /api/word");
  const round = await getCurrentRound();
  res.json(round);
});

app.get("/api/allowedWord/:word", async (req, res) => {
  console.log("get /api/allowedWord");
  console.time("GET allowedWord");

  const responseObj = {
    success: false,
    allCorrect: false,
    guess: req.params.word.split(""),
    result: Array(5).fill(""),
  };

  console.time("DB allowedWord");
  // const isAllowed = await allowedWord(req.params.word);
  const [currentRound, isAllowed] = await Promise.all([
    getCurrentRound(),
    allowedWord(req.params.word),
  ]);

  console.timeEnd("DB allowedWord");

  if (isAllowed) {
    responseObj.success = true;

    // console.time("GET currentRound");
    // const currentRound = await getCurrentRound();
    // console.timeEnd("GET currentRound");
    const correctWord = currentRound.word;

    for (let i = 0; i < 5; i++) {
      if (responseObj.guess[i].toUpperCase() === correctWord[i].toUpperCase()) {
        responseObj.result[i] = "C";
      } else if (correctWord.includes(responseObj.guess[i])) {
        responseObj.result[i] = "W";
      } else {
        responseObj.result[i] = "-";
      }
    }

    if (req.params.word === correctWord) {
      responseObj.allCorrect = true;
    }

    console.timeEnd("GET allowedWord");
    res.json(responseObj);
  } else {
    res.json({ success: false });
  }
});

app.get("/api/test", (req, res) => {
  console.log("GET /api/test");

  let text = newRound();

  res.json({ success: true });
});
