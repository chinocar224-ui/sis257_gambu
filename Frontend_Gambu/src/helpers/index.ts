function clearAuthLocalStorage() {
  localStorage.removeItem('user')
  localStorage.removeItem('userId')
  localStorage.removeItem('userRole')
  localStorage.removeItem('token')
}

function getTokenFromLocalStorage() {
  const tokenAuth = localStorage.getItem('token') || ''
  if (!tokenAuth) return null

  try {
    const jwtPayload = parseJwt(tokenAuth)
    const isExpired = jwtPayload.exp < Date.now() / 1000

    if (!isExpired) return tokenAuth
  } catch {
    // Si quedó un token viejo/corrupto en el navegador, se limpia
    // para evitar que el sistema entre directo a un panel anterior.
  }

  clearAuthLocalStorage()
  return null
}

function parseJwt(token: string) {
  const base64Url = token.split('.')[1] ?? ''
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join('')
  )
  return JSON.parse(jsonPayload)
}

export { getTokenFromLocalStorage, parseJwt, clearAuthLocalStorage }
