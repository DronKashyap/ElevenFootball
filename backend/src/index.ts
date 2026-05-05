import express  from 'express';

//import routes
import authRoutes from "./routes/authroutes.js";

const app = express();  
app.use(express.json());

app.get('/', (req, res) => {    
    res.send('Welcome to Footheroes Backend!');
});

app.use("/api/auth", authRoutes);

//create schema.js
//add auth

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});