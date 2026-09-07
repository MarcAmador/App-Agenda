import request from 'supertest'
import { app } from '../app'

describe('HTTP API Endpoints Integration', () => {
  it('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('environment')
    expect(res.body).toHaveProperty('timestamp')
  })

  it('GET /api/v1/ruta-inexistente returns 404', async () => {
    const res = await request(app).get('/api/v1/ruta-inexistente')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error', 'Ruta no encontrada')
  })
})
