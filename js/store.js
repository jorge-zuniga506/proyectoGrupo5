/**
 * storage.js
 * Persistent storage using localStorage.
 */
export class ScholarshipDB {
    static getAll(entity) {
        const data = localStorage.getItem(entity);
        return data ? JSON.parse(data) : [];
    }

    static saveAll(entity, data) {
        localStorage.setItem(entity, JSON.stringify(data));
    }

    static getById(entity, id) {
        const data = this.getAll(entity);
        return data.find(item => item.id === parseInt(id));
    }

    static create(entity, item) {
        const data = this.getAll(entity);
        item.id = Date.now();
        data.push(item);
        this.saveAll(entity, data);
        return item;
    }

    static update(entity, id, updates) {
        const data = this.getAll(entity);
        const index = data.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.saveAll(entity, data);
            return data[index];
        }
        return null;
    }

    static delete(entity, id) {
        let data = this.getAll(entity);
        data = data.filter(item => item.id !== parseInt(id));
        this.saveAll(entity, data);
    }
}
