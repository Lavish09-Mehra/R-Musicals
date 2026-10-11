import { WishList } from '../Database/wishlist_Schema.js';
import { verifyToken } from '../Middleware/userAuth.js';
import mongoose from 'mongoose';
import { Products } from '../Database/products_Schema.js';
import express from 'express';

export const wishlist = express.Router();

wishlist.post('/api/wishlist', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { product } = req.body;

        if (!user) {
            return res.status(401).json({
                message: "🔒 You need to be logged in to use the wishlist."
            });
        }
        if (!product || !mongoose.isValidObjectId(product)) {
            return res.status(400).json({
                message: '⚠️ A valid product ID is required.'
            });
        }

        const FindProduct = await Products.findById(product);
        if (!FindProduct) {
            return res.status(404).json({
                message: '😕 Product not found. It may have been removed.'
            });
        }

        const FindWishList = await WishList.findOne({ user });
        let wishlistDocument;
        if (!FindWishList) {
            wishlistDocument = await WishList.create({
                user,
                products: [product]
            });
        }
        else {
            const ExistingProduct = FindWishList.products.find(
                pro => pro.toString() === product
            );

            if (ExistingProduct) {
                return res.status(200).json({
                    message: '💚 This product is already in your wishlist.',
                    wishlist: FindWishList
                });
            }
            else {
                FindWishList.products.push(product);
                wishlistDocument = await FindWishList.save();
            }
        }
        return res.status(200).json({
            message: '💚 Product added to your wishlist!',
            wishlist: wishlistDocument
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t update your wishlist. Please try again.'
        });
    }
});

wishlist.get('/api/wishlist', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;

        const GetWishList = await WishList.findOne({ user })
            .populate('products');
        if (!GetWishList) {
            return res.status(404).json({
                message: '💚 Your wishlist is empty. Save items you love for later!'
            });
        }

        return res.status(200).json({
            wishlist: GetWishList
        })
    }
    catch (err) {
        return res.status(500).json(
            {
                message: '💥 Oops! We couldn\'t load your wishlist. Please try again.',
                error: err
            }
        );
    }
});

wishlist.delete('/api/wishlist/:productId', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;
        const { productId } = req.params;
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                message: '⚠️ Invalid product ID.'
            });
        }

        const FindWishlistProduct = await WishList.findOne({ user });

        if (!FindWishlistProduct) {
            return res.status(404).json({
                message: '💚 Your wishlist is empty. Save items you love for later!'
            });
        };

        const ExistingProduct = FindWishlistProduct.products.find(
            prod => prod.toString() === productId
        );

        if (!ExistingProduct) {
            return res.status(404).json({
                message: '😕 That product is not in your wishlist.'
            });
        }

        FindWishlistProduct.products.pull(productId);

        await FindWishlistProduct.save();
        return res.status(200).json({
            message: '✅ Product removed from your wishlist.',
            wishlist: FindWishlistProduct
        });
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t update your wishlist. Please try again.'
        });
    }
});

wishlist.delete('/api/wishlist', verifyToken, async (req, res) => {
    try {
        const user = req.User.userId;

        const DeleteWishlist = await WishList.findOneAndDelete({ user });

        if (!DeleteWishlist) {
            return res.status(404).json({
                message: '💚 Your wishlist is already empty.'
            });
        }

        return res.status(200).json({
            message: '✅ Wishlist cleared successfully!'
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: '💥 Oops! We couldn\'t clear your wishlist. Please try again.'
        });
    }
});


