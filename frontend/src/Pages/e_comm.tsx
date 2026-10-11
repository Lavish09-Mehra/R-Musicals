import "../Styles/eComm.css";

import guitarImage from "../assets/guitar_yamaha.jpg";
import keyboardImage from "../assets/Casio_keyboard.jpg";
import electricGuitarImage from "../assets/Electric_Guitar.jpg";
import tablaImage from "../assets/radel_Tabla.jpg";
import ukuleleImage from "../assets/Kadence_ukulele.jpg";
import harmonicaImage from "../assets/Harmonica_hohner.jpg";
import logoImage from "../assets/Guitar Cart Emblem.png";

type product_info = {
    id: number;
    name: string;
    brand: string;
    image: string;
    description: string;
    price: number;
    discount: number;
    rating: number;
}

export function ECommerce() {


    const products: product_info[] = [
        {
            id: 1,
            name: "Acoustic Guitar",
            brand: "Yamaha",
            image: guitarImage,
            description: "A beginner-friendly acoustic guitar.",
            price: 12999,
            discount: 10,
            rating: 4.5
        },

        {
            id: 2,
            name: "Keyboard",
            brand: "Casio",
            image: keyboardImage,
            description: "61-key electronic keyboard.",
            price: 8999,
            discount: 15,
            rating: 4.7
        },

        {
            id: 3,
            name: "Electric Guitar",
            brand: "Fender",
            image: electricGuitarImage,
            description: "A classic electric guitar with a bright, versatile tone.",
            price: 24999,
            discount: 12,
            rating: 4.6
        },

        {
            id: 4,
            name: "Tabla Set",
            brand: "Radel",
            image: tablaImage,
            description: "Traditional tabla set with a sheesham wood dayan and brass bayan.",
            price: 6499,
            discount: 8,
            rating: 4.4
        },

        {
            id: 5,
            name: "Ukulele",
            brand: "Kadence",
            image: ukuleleImage,
            description: "A compact soprano ukulele that's easy to learn and carry.",
            price: 3299,
            discount: 20,
            rating: 4.3
        },

        {
            id: 6,
            name: "Harmonica",
            brand: "Hohner",
            image: harmonicaImage,
            description: "A 10-hole diatonic harmonica in the key of C.",
            price: 1499,
            discount: 5,
            rating: 4.5
        }
    ];

    return (
        <>
            <div className="gc-header Header">
                {/* Search Bar and image logo */}
                <img className="gc-logo" src={logoImage} alt="Guitar Cart" />
                <input
                    className="gc-search-input"
                    type="text"
                    placeholder="Search instruments, brands, accessories.."
                    aria-label="Search products"
                />
                <button className="gc-search-btn btn-mode" type="button">Search</button>

            </div>

            <main className="gc-main main">
                {/* Product Listing */}
                <div className="gc-grid">
                    {products.map((product) => (
                        <article className="gc-card" key={product.id}>
                            <img className="gc-card-img" src={product.image} alt={product.name} />
                            <h2 className="gc-card-title">{product.name}</h2>
                            <p className="gc-card-brand">{product.brand}</p>
                            <p className="gc-card-price">₹{product.price}</p>
                        </article>
                    ))}
                </div>
            </main>
        </>
    )
}