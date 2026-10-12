import "../Styles/footer_component.css";

/* --------------------------------------------------------------------------
   Guitar Cart — footer, styled to match header_component.css
   (same #0D0D0D shell, #242424 accent, Inter font, hairline borders)
   -------------------------------------------------------------------------- */

export function HomePageFooter() {
    return (
        <footer className="Footer">
            <div className="footer_inner">
                {/* ---------- brand ---------- */}
                <div className="footer_brand">
                    <h2>R Musicals</h2>
                    <p className="footer_tag">Your Music, Our Passion.</p>
                    <p className="footer_desc">
                        Discover quality musical instruments and bring
                        your musical journey to life with R Musicals.
                    </p>
                    <br></br>
                    <p>
                        Whether you’re strumming your first chord or perfecting your masterpiece, we’ve got the instrument that makes every note count
                    </p>
                </div>

                {/* Product Categories */}
                <div className="footer_categories">
                    <h3>Categories</h3>
                    <p>Our Most selling and Famous categories which was loved my Indians</p>
                    <a href="">Guitar</a>
                    <a href="">Tabla</a>
                    <a href="">Harmonium</a>
                    <a href="">Dhol</a>
                    <a href="">And Rest are in our Shop ➤</a>
                </div>

                {/* ---------- quick links ---------- */}
                <div className="footer_links">
                    <h3>Quick Links</h3>
                    <a href="/">Home</a>
                    <a href="/products">Shop</a>
                    <a href="/about">About us</a>
                    <a href="/account">My Account</a>
                </div>

                {/* ---------- contact ---------- */}
                <div className="footer_contact">
                    <h3>Stay Tuned</h3>
                    <p>Have questions about our instruments?</p>
                    <p>We're here to help you find your sound.</p>
                    <a href="/contact" className="footer_contact-btn">
                        Contact Us
                    </a>
                </div>
            </div>

            {/* ---------- about band ---------- */}
            <div className="footer_msg">
                <h3>About This Project</h3>
                <p>
                    <strong>Created by:</strong> Lavish Mehra
                </p>
                <p>
                    R Musicals is an e-commerce website for musical instruments,
                    built using the MERN stack (MongoDB, Express.js, React.js, and Node.js).
                    This project was developed for learning and practical experience
                    in building a real-world e-commerce application.
                </p>
                <p>
                    <strong>Note:</strong> This website is a development project.
                    Product details, prices, and availability may be for demonstration
                    purposes.
                </p>

                <div className="footer_msg-socials">
                    <a
                        href="https://linkedin.com/in/lavish09dev/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        LinkedIn
                    </a>
                    <a
                        href="https://github.com/Lavish09-Mehra"
                        target="_blank"
                        rel="noreferrer"
                    >
                        GitHub
                    </a>
                    <a href="mailto:YOUR_EMAIL@gmail.com">Email</a>
                </div>
            </div>

            {/* ---------- bottom bar ---------- */}
            <div className="footer_bottom">
                <p>
                    © {new Date().getFullYear()} R Musicals.
                    All rights reserved.
                </p>
                <p className="footer_tagline">Keep Playing. Keep Creating 🎵</p>
            </div>
        </footer>
    );
}

export default HomePageFooter;
