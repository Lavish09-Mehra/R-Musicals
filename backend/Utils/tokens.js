import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Access token: short-lived, sent on every request
export const signAccessToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

// Refresh token: long-lived, used ONLY to mint a new access token.
// It embeds a random opaque string (rt) that we store in the DB, so a
// stolen/forged refresh token is useless without the matching DB record,
// and we can revoke it by clearing the field.
export const signRefreshToken = (payload, rt) =>
    jwt.sign(
        { ...payload, type: 'refresh', rt },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

// random opaque string stored on the user doc
export const newRefreshTokenId = () => crypto.randomBytes(32).toString('hex');

// Build both tokens and persist the refresh id on the user document.
// Returns { accessToken, refreshToken }.
export const issueTokenPair = async (User, user) => {
    const rt = newRefreshTokenId();

    const accessToken = signAccessToken({ userId: user._id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id, role: user.role }, rt);

    // $set avoids running validators on the whole doc
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: rt } });

    return { accessToken, refreshToken };
};
