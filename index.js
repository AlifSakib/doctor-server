require("colors");
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4mqdriq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function dbConnect() {
  try {
    await client.connect();
    console.log("Database Connected ".bgGreen);
  } catch (error) {
    console.log(error.message.bgRed);
  }
}
dbConnect();

const Appointments = client
  .db("DoctorsPortal")
  .collection("AppointmentOptions");

// User aggregate to query multiple collection and then merge data
app.get("/appointments", async (req, res) => {
  const date = req.query.date;
  const appointments = await Appointments.find({}).toArray();
  const bookingQuery = { appointmentDate: date };
  const alreadyBooked = await Booking.find(bookingQuery).toArray();
  console.log(alreadyBooked);
  appointments.forEach((appointment) => {
    const appointmentBooked = alreadyBooked.filter(
      (book) => book.treatment === appointment.name
    );
    const bookedSlots = appointmentBooked.map((book) => book.slot);
    const remainingSlots = appointment.slots.filter(
      (slot) => !bookedSlots.includes(slot)
    );
    appointment.slots = remainingSlots;
  });
  res.send(appointments);
});

const Booking = client.db("DoctorsPortal").collection("Booking");
app.post("/bookings", async (req, res) => {
  const booking = req.body;
  const query = {
    appointmentDate: booking.appointmentDate,
    treatment: booking.treatment,
    email: booking.email,
  };
  const alreadyBooked = await Booking.find(query).toArray();
  if (alreadyBooked.length) {
    const message = `You already have a booking on ${booking.appointmentDate}`;
    return res.send({
      success: false,
      message,
    });
  }
  const result = await Booking.insertOne(booking);
  res.send({
    success: true,
    message: "Booking Successfull",
    data: result,
  });
});

app.get("/booking-details", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const booking = await Booking.find(query).toArray();
  res.send(booking);
});

const Users = client.db("DoctorsPortal").collection("Users");
app.post("/users", async (req, res) => {
  const user = req.body;
  const result = await Users.insertOne(user);
  res.send({ message: "User Information Saved" });
});

app.listen(port, () => {
  console.log(`Server is listening to port ${port} `.bgGreen);
});
