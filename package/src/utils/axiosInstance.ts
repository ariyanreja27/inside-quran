import axios from 'axios';
import {QURAN_API} from '../common';
const axiosInstance = axios.create({
  baseURL: QURAN_API,
});

export default axiosInstance;
