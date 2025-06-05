const sendResponse = (res, statusCode, success, message, data = null, extra = {}) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  if (data !== null) {
    response.data = data;
  }
  res.status(statusCode).json(response);
};

const responses = {
  success: (res, message = 'Operación exitosa', data = null, extra = {}) =>
    sendResponse(res, 200, true, message, data, extra),

  created: (res, message = 'Recurso creado exitosamente', data = null, extra = {}) =>
    sendResponse(res, 201, true, message, data, extra),

  badRequest: (res, message = 'Solicitud inválida', data = null, extra = {}) =>
    sendResponse(res, 400, false, message, data, extra),

  unauthorized: (res, message = 'No autorizado', data = null, extra = {}) =>
    sendResponse(res, 401, false, message, data, extra),

  forbidden: (res, message = 'Acceso denegado', data = null, extra = {}) =>
    sendResponse(res, 403, false, message, data, extra),

  notFound: (res, message = 'Recurso no encontrado', data = null, extra = {}) =>
    sendResponse(res, 404, false, message, data, extra),

  serverError: (res, message = 'Error interno del servidor', data = null, extra = {}) => {
    console.error('Internal Server Error:', message); // Log server errors
    sendResponse(res, 500, false, message, data, extra);
  },

  // Puedes añadir más tipos de respuestas si es necesario
  conflict: (res, message = 'Conflicto', data = null, extra = {}) =>
    sendResponse(res, 409, false, message, data, extra),

  unprocessableEntity: (res, message = 'Entidad no procesable', data = null, extra = {}) =>
    sendResponse(res, 422, false, message, data, extra),
};

module.exports = {
  sendResponse,
  responses,
};
