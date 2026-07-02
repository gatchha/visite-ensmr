const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET non défini dans le fichier .env');
}

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Session invalide ou expirée' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.type !== 'admin') {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
}

function estPrincipalOuSuperAdmin(user) {
    return user && (user.role === 'principal' || user.role === 'super_admin');
}

function requireSelfOrAdmin(req, res, next) {
    if (req.user.type === 'admin') {
        return next();
    }

    if (req.user.email === req.params.email) {
        return next();
    }

    return res.status(403).json({ message: 'Accès non autorisé' });
}

function requireSelfIdOrAdmin(req, res, next) {
    if (req.user.type === 'admin') {
        return next();
    }

    if (String(req.user.id) === String(req.params.id)) {
        return next();
    }

    return res.status(403).json({ message: 'Accès non autorisé' });
}

module.exports = {
    generateToken,
    authenticate,
    requireAdmin,
    requireSelfOrAdmin,
    requireSelfIdOrAdmin,
    estPrincipalOuSuperAdmin,
};
