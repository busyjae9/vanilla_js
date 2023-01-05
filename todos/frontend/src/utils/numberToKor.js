import { each, go, hi, range } from 'fxjs';

const numberToKorean = (number, str = '', pre = '') => {
    if (Number(number) <= 0) return false;

    const input_number = String(number);

    const units = ['', '만', '억', '조', '경'];

    const thumb_index = input_number.length % 4;
    const unit_index = Math.floor(input_number.length / 4);

    let thumbs = '';

    go(
        range(thumb_index === 0 ? 4 : thumb_index),
        each((index) => (thumbs += input_number[index])),
    );

    return pre + thumbs + units[unit_index] + str;
};

export default numberToKorean;
