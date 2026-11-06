const response = (res, statusCode, payload, message) => {
    res.status(statusCode).json({
        payload: payload,
        message: message
    })
}

module.exports = response