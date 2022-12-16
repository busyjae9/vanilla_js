import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://192.168.0.7',
    withCredentials: true
});

export default instance;