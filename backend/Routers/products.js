import { Products } from '../Database/products_Schema.js';
import { User } from '../Database/users_Schema.js';
import express from 'express';
import { verifyOwner } from '../Middleware/OwnerAuth.js';

export const pro_duct = express.Router();

pro_duct.post('/api/products', verifyOwner, async (req, res) => {
    try {
        const { name, Category, brand, image, description, price, discount, rating } = req.body;

        if (!name || !Category || !brand || !image || !description || !price) {
            return res.status(400).json({
                message: "⚠️ Please fill in all the basic details (name, category, brand, image, description, price)."
            });
        }

        const CreateProduct = new Products({
            name,
            Category,
            brand,
            image,
            description,
            price,
            discount,
            rating
        });

        const data = await CreateProduct.save();

        return res.status(201).json({
            message: "✅ Product listed successfully!",
            data
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "💥 Oops! Something went wrong while listing the product.",
            error: err
        });
    }
});

pro_duct.get('/api/products', async (req, res) => {
    try {
        const GetAllProducts = await Products.find();

        if (!GetAllProducts.length) {
            return res.status(404).json({ message: "😕 No products found. Check back later!" });
        }

        const productsWithFinalPrice = GetAllProducts.map(product => {
            const finalPrice =
                product.price - (product.price * (product.discount || 0) / 100);

            return {
                ...product.toObject(),
                finalPrice
            };
        });

        return res.status(200).json({
            getAllProducts: productsWithFinalPrice
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "💥 Oops! We couldn't load the products. Please try again.",
            error: err
        });
    }
});

pro_duct.get('/api/product/category/:category_product', async (req, res) => {
    try {
        const category_product = req.params.category_product;

        const items = await Products.find({ Category: category_product });
        if (!items.length) {
            return res.status(404).json({
                message: `😕 No products found in the "${category_product}" category.`
            });
        }

        const itemsWithFinalPrice = items.map(product => {
            const finalPrice =
                product.price - (product.price * (product.discount || 0) / 100);

            return {
                ...product.toObject(),
                finalPrice
            };
        });

        return res.status(200).json({
            items: itemsWithFinalPrice
        })
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t load this category. Please try again.',
            error: err
        });
    }
});

pro_duct.get('/api/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const OneProduct = await Products.findById(id);
        if(!OneProduct){
            return res.status(404).json({
                message: "😕 Sorry, this product doesn't exist."
            });
        }

        const finalPrice =
            OneProduct.price - (OneProduct.price * (OneProduct.discount || 0) / 100);

        return res.status(200).json({
            OneProduct: {
                ...OneProduct.toObject(),
                finalPrice
            }
        });
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! Something went wrong. Please try again.',
            error: err
        });
    }
});

pro_duct.put('/api/product/:id', verifyOwner, async (req, res) => {

    try {
        const { id } = req.params;

        // check the logged-in user is really an owner in the database
        const FindAdmin = await User.findById(req.User.userId).select('role');
        if (!FindAdmin || FindAdmin.role !== 'owner') {
            return res.status(403).json({ message: '⛔ Owner access required. You do not have permission to do this.' });
        }

        const updatedProduct = await Products.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedProduct) {
            return res.status(404).json({ message: "😕 Product not found. It may have been removed." });
        }

        const finalPrice =
            updatedProduct.price - (updatedProduct.price * (updatedProduct.discount || 0) / 100);

        return res.status(200).json({
            message: "✅ Product updated successfully!",
            data: {
                ...updatedProduct.toObject(),
                finalPrice
            }
        });
    }
    catch (err) {
        return res.status(500).json({
            message: '💥 Oops! We couldn\'t update the product. Please try again.',
            error: err
        });
    }
});

pro_duct.delete('/api/products/:id', verifyOwner, async(req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Products.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: "😕 Product not found. It may have already been removed." });
        }

        return res.status(200).json({
            message: "✅ Product deleted successfully!",
            data: deletedProduct
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "💥 Oops! We couldn't delete the product. Please try again.",
            error: err.message
        });
    }
});