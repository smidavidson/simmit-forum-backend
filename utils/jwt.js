import jwt from 'jsonwebtoken';
import ms from 'ms';

// Generate a JWT access token that lasts 10 minutes
export function generateAccessToken(user_data) {
    const access_token = jwt.sign(user_data, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRY
    });
    return access_token;
}

// Generate a JWT access token that lasts 7 days
export function generateRefreshToken(user_data) {
    const refresh_token = jwt.sign({user_id: user_data.user_id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRY
    })
    return refresh_token;
}

export function verifyAccessToken(accessToken) {
    try {
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        return decodedAccessToken;
    } catch (error) {
        throw error;
    }
}

export function verifyRefreshToken(refreshToken) {
    try {
        const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        return decodedRefreshToken;
    } catch (error) {
        throw error;
    }
}

export function calculateExpiryDate(expiresIn) {
    const milliseconds = ms(expiresIn);
    const expiryDate = new Date(Date.now() + milliseconds);
    return expiryDate;
}