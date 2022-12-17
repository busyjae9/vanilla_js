import axios from "axios";

const instance = axios.create({
  baseURL: "http://192.168.0.20",
  withCredentials: true
});

export default instance;