import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config.js';
import cors from 'cors';

import { pro_duct } from './Routers/products.js';
import { SignIN } from './Routers/sign_in.js';
import { order } from './Routers/order.js';
import { user } from './Routers/users.js';
import { auth } from './Routers/auth.js';
import { LogIN } from './Routers/login.js';
import { cart } from './Routers/cart.js';
import { wishlist } from './Routers/wishlist.js';


const app = express();
app.use(express.json());
app.use(cors());
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Server connected to database');

        app.listen(3000, () => {
            console.log('http://localhost:3000');
        });
    }).catch((err) => {
        console.error(err);
    }
);
app.get('/', (req, res) => {
    res.end('The Server is Up..');
});

app.use(pro_duct);
app.use(SignIN);
app.use(LogIN);
app.use(cart);
app.use(wishlist);
app.use(order);
app.use(user);
app.use(auth);
