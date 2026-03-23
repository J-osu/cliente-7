// tests/apiServicio.spec.ts
// ─────────────────────────────────────────────────────────────
// PRUEBAS UNITARIAS — Servicio Axios con interceptores
//
// Se usa axios-mock-adapter para simular respuestas HTTP sin
// hacer peticiones reales a la red.
// ─────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { setActivePinia, createPinia } from 'pinia'

// ── Mocks de dependencias externas ───────────────────────────
// Simulamos vue-toast-notification para no necesitar el DOM completo
vi.mock('vue-toast-notification', () => ({
  useToast: () => ({
    error:   vi.fn(),
    success: vi.fn(),
  }),
}))

// ── Importaciones del código a probar ────────────────────────
import { instanciaAxios, obtenerPerfil } from '../services/apiServicio'
import { useSesionStore } from '../stores/sesion'

// ─────────────────────────────────────────────────────────────
describe('apiServicio — Interceptores y peticiones', () => {
  let mock: InstanceType<typeof MockAdapter>
  let sesion: ReturnType<typeof useSesionStore>

  beforeEach(() => {
    // Crear una instancia nueva de Pinia antes de cada test
    setActivePinia(createPinia())
    sesion = useSesionStore()

    // Crear adaptador mock sobre nuestra instancia de Axios
    mock = new MockAdapter(instanciaAxios)
  })

  afterEach(() => {
    mock.restore()
    vi.clearAllMocks()
  })

  // ── Test 1: Inyección del Bearer Token ─────────────────────
  it('debería inyectar el token Bearer en la cabecera Authorization', async () => {
    // Arrange: hay un token en el store
    sesion.guardarSesion('token-de-prueba', 'Ana', 'ana@test.com', '')
    mock.onGet('/user').reply(200, { login: 'ana', id: 1 })

    // Act
    await obtenerPerfil()

    // Assert: la petición enviada incluye la cabecera Authorization
    const peticionEnviada = mock.history.get[0]
    expect(peticionEnviada.headers?.['Authorization']).toBe('Bearer token-de-prueba')
  })

  // ── Test 2: Sin token, no se inyecta la cabecera ───────────
  it('no debería añadir Authorization si el usuario no está autenticado', async () => {
    // Arrange: store vacío (sin token)
    mock.onGet('/user').reply(200, { login: 'anon' })

    // Act
    await obtenerPerfil()

    // Assert
    const peticionEnviada = mock.history.get[0]
    expect(peticionEnviada.headers?.['Authorization']).toBeUndefined()
  })

  // ── Test 3 (OBLIGATORIO): 401 → borrar sesión ─────────────
  it('debería llamar a borrarSesion() cuando la API devuelve 401', async () => {
    // Arrange: el usuario está autenticado
    sesion.guardarSesion('token-caducado', 'Luis', 'luis@test.com', '')
    mock.onGet('/user').reply(401, { message: 'Bad credentials' })

    // Espiamos borrarSesion para verificar que se llama
    const espiarBorrarSesion = vi.spyOn(sesion, 'borrarSesion')

    // Act: la petición debe rechazarse (error 401)
    await expect(obtenerPerfil()).rejects.toThrow()

    // Assert: borrarSesion fue llamada exactamente una vez
    expect(espiarBorrarSesion).toHaveBeenCalledTimes(1)
    // Y el token ya no existe en el store
    expect(sesion.token).toBeNull()
    expect(sesion.estaAutenticado).toBe(false)
  })

  // ── Test 5: 500 → NO borra sesión, sólo muestra Toast ─────
  it('NO debería borrar la sesión si el error es 500 (error de servidor)', async () => {
    sesion.guardarSesion('token-valido', 'Carlos', 'carlos@test.com', '')
    mock.onGet('/user').reply(500, { message: 'Internal Server Error' })

    const espiarBorrarSesion = vi.spyOn(sesion, 'borrarSesion')

    await expect(obtenerPerfil()).rejects.toThrow()

    // La sesión no se borra con un error 500
    expect(espiarBorrarSesion).not.toHaveBeenCalled()
    expect(sesion.token).toBe('token-valido')
  })

  // ── Test 6: Petición exitosa → devuelve datos correctos ───
  it('debería devolver los datos del perfil cuando la API responde 200', async () => {
    const perfilFalso = { login: 'dev123', id: 42, name: 'Dev Test' }
    sesion.guardarSesion('token-ok', 'Dev', 'dev@test.com', '')
    mock.onGet('/user').reply(200, perfilFalso)

    const resultado = await obtenerPerfil()

    expect(resultado).toEqual(perfilFalso)
    expect(resultado.login).toBe('dev123')
  })

  // ── Test 7: Lista de repositorios ─────────────────────────
})