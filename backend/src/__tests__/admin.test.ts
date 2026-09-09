import request from 'supertest'
import { app } from '../app'

describe('Admin Public and Protected Endpoints', () => {
  it('GET /api/v1/admin/public-settings returns 200 without authentication', async () => {
    const res = await request(app).get('/api/v1/admin/public-settings')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('app_name')
    expect(res.body).toHaveProperty('global_banner_enabled')
  })

  it('GET /api/v1/admin/overview returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/admin/overview')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('GET /api/v1/admin/users returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/admin/users')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/admin/templates returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/admin/templates')
    expect(res.status).toBe(401)
  })
})
