const Regexes = {};

Regexes.email = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
// Regexes.password = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~])(?!.*[ \t\n\x0B\f\r]).{8,255}$/g
Regexes.password = /^(?=.*\d)(?=.*[a-zA-Z]).{8,255}$/g;
Regexes.name = /^[가-힣a-zA-Z]+$/g;
export default Regexes;