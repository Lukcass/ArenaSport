const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    message,
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
};

const responses = {
  success: (res, message = 'Operación exitosa', data = null) => 
    sendResponse(res, 200, true, message, data),
    
  created: (res, message = 'Recurso creado', data = null) => 
    sendResponse(res, 201, true, message, data),
    
  badRequest: (res, message = 'Solicitud inválida') => 
    sendResponse(res, 400, false, message),
    
  unauthorized: (res, message = 'No autorizado') => 
    sendResponse(res, 401, false, message),
    
  forbidden: (res, message = 'Acceso denegado') => 
    sendResponse(res, 403, false, message),
    
  notFound: (res, message = 'Recurso no encontrado') => 
    sendResponse(res, 404, false, message),
    
  conflict: (res, message = 'Conflicto de recursos') => 
    sendResponse(res, 409, false, message),
    
  serverError: (res, message = 'Error interno del servidor') => 
    sendResponse(res, 500, false, message)
};

module.exports = { sendResponse, responses };