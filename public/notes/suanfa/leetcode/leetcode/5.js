/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
    let res = ''
   
    for(let i = 0; i<s.length;i++) {
        let res1 = findLongest(s, i, i)// 奇数回文
        let res2 = findLongest(s, i, i+1)// 偶数回文
        res = res.length > res1.length ? res: res1
        res = res.length > res2.length ? res: res2
    }
    return res

    function findLongest(s, l, r) {
        while(l>=0 && r<s.length && s[l] === s[r]) {
            l--
            r++
        }
        return s.slice(l+1, r)
    }


};

console.log(longestPalindrome('abcdcdbe'))