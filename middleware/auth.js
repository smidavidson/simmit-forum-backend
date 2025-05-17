export const isAuthenticated = async (req, res, next) => {
    console.log('isAuthenticated middleware triggered:', {
        sessionID: req.sessionID,
        hasSession: !!req.session,
        sessionData: req.session,
        hasUser: !!req.session?.user,
        userData: req.session?.user
    });

    if (req.session && req.session.user) {
        console.log("User was authorized");
        return next();
    }
    console.log("User was not authorized");
    return res.status(401).json({message: "Not authenticated"});
}