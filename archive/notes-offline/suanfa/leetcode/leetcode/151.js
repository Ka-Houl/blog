/**
 * @param {string} s
 * @return {string}
 */
var reverseWords = function(s) {
    let list = s.split(' ').filter(str => str)
    return list.reverse().join(' ')
};

console.log(reverseWords(' 123 567'))