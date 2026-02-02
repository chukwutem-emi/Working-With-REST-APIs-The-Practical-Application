const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
       return res.status(401).json({message: "Please set 'Authorization' header."}); 
    }
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({message: "Token expired. Please login again"});
        }
        return res.status(401).json({message: "Invalid token. Please login"});
    }
    
    if (!decodedToken) {
        return res.status(401).json({message: "Not authenticated, please login"});
    }
    // Attach the userId to req
    req.userId = decodedToken.userId;
    next();
};