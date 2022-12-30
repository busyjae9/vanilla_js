import axios from 'axios';

const instance = axios.create({
    withCredentials: true,
});

export const cancel_token = axios.CancelToken;

export default instance;
