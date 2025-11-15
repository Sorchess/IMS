import httpClient from "../httpClient.ts";

export default class DevicesService {
    static async getAllDevices(limit?: number, page?: number) {
        return await httpClient.get('/devices/', {
            params: {
                _limit: limit,
                _page: page
            }
        })
    }

    static async createDevice(token: string) {
        return await httpClient.post(`/devices/?token=${token}`)
    }

    static async getDevice(id: number) {
        return await httpClient.get(`/devices/${id}`)
    }

    static async deleteDevice(id: number) {
        return await httpClient.delete(`/devices/${id}`)
    }

    static async getTelemetry(id: number, limit?: number, page?: number) {
        return await httpClient.get(`/telemetry/${id}`, {
            params: {
                _limit: limit,
                _page: page
            }
        })
    }
}