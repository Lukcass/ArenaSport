function validarEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'El email es requerido';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) ? null : 'Formato de email inválido';
}
function validarPassword(password) {
  if (!password || typeof password !== 'string') {
    return 'La contraseña es requerida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  } 
  if (password.length > 128) {
    return 'La contraseña no puede exceder 128 caracteres';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'La contraseña debe tener al menos una mayúscula, una minúscula y un número';
  }
  return null;
}
function validarUsername(username) {
  if (!username) return null; 
  if (typeof username !== 'string') {
    return 'El username debe ser texto válido';
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return 'El username debe tener entre 3 y 20 caracteres';
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return 'Username solo puede contener letras, números y guiones bajos';
  }
  return null;
}
function validarNombre(nombre) {
  if (!nombre || typeof nombre !== 'string') {
    return 'El nombre es requerido';
  }
  const trimmed = nombre.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return 'El nombre debe tener entre 2 y 50 caracteres';
  }
  return null;
}
function validarRole(role) {
  if (!role) return null;
  const rolesValidos = ['jugador', 'admin'];
  return rolesValidos.includes(role) ? null : 'Role inválido';
}
module.exports = {
  validarEmail,
  validarPassword,
  validarUsername,
  validarNombre,
  validarRole
};
function validarEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'El email es requerido';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) ? null : 'Formato de email inválido';
}
function validarPassword(password) {
  if (!password || typeof password !== 'string') {
    return 'La contraseña es requerida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  } 
  if (password.length > 128) {
    return 'La contraseña no puede exceder 128 caracteres';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'La contraseña debe tener al menos una mayúscula, una minúscula y un número';
  }
  return null;
}
function validarUsername(username) {
  if (!username) return null; 
  if (typeof username !== 'string') {
    return 'El username debe ser texto válido';
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return 'El username debe tener entre 3 y 20 caracteres';
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return 'Username solo puede contener letras, números y guiones bajos';
  }
  return null;
}
function validarNombre(nombre) {
  if (!nombre || typeof nombre !== 'string') {
    return 'El nombre es requerido';
  }
  const trimmed = nombre.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return 'El nombre debe tener entre 2 y 50 caracteres';
  }
  return null;
}
function validarRole(role) {
  if (!role) return null;
  const rolesValidos = ['jugador', 'admin'];
  return rolesValidos.includes(role) ? null : 'Role inválido';
}
module.exports = {
  validarEmail,
  validarPassword,
  validarUsername,
  validarNombre,
  validarRole
};