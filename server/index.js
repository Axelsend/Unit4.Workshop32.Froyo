// imports here for express and pg
const express = require("express");
const app = express();
const pg = require("pg");
const path = require("path");
const client = new pg.Client(
  "postgres://denver.axelsen:1234@localhost:5432/acme_ice_cream_db"
);

// static routes here (you only need these for deployment)
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use(express.json());

// app routes here
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
  SELECT * FROM flavors
`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next();
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await client.query("SELECT * FROM flavors WHERE id = $1", [
      id,
    ]);
    if (response.rows.length > 0) {
      res.send(response.rows[0]);
    } else {
      res.status(404).send({ message: "Flavor not found" });
    }
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/flavors", async (req, res) => {
  const { name, is_favorite } = req.body;
  try {
    const response = await client.query(
      "INSERT INTO flavors(name, is_favorite) VALUES ($1, $2) RETURNING *",
      [name, is_favorite]
    );
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await client.query(
      "DELETE FROM flavors WHERE id = $1",
      [id]
    );
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  const { is_favorite } = req.body
  try {
    const response = await client.query(
      "UPDATE flavors SET is_favorite = $1 WHERE id = $2 RETURNING *",
      [is_favorite, id]
    );
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// create your init function
const init = async () => {
  await client.connect();
  const SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP default now()
    );
    INSERT INTO flavors(name, is_favorite) VALUES('vanilla', true), ('chocolate', false), ('strawberry', false);
    `;
  await client.query(SQL);

  console.log("data seeded");

  app.listen(3000, () => console.log("listening on port 3000"));
};

// init function invocation
init();
