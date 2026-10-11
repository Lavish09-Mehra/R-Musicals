
export function LoginComponent(){

    return(
        <div className="Page">
            <div className="Heading">
                <h2 className="headingLogin">Customer Login Center</h2>
            </div>
            <div className="body">
                <input type="email" placeholder="Enter Your Email 📧"></input>
                <input type="password" placeholder="Enter Password"></input>
                
                <div className="body_btn">
                    <button className="btn_login">Login</button>
                </div>
                <div className="signupRoute">
                    {/* Later to Link */}
                    <h2>New User..</h2>
                </div>
                <div className="feedBack">
                    <h3 className="feed_ques">Would you like to tell us something or do you have a question?</h3>
                    <button className="btn_feed">💬Help & Feedback</button>

                    <h3 className="project_ques">Would you like to Give FeedBack for this project?</h3>
                    <button className="btn_project">Review📝</button>
                </div>
            </div>
        </div>
    )
}