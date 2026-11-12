/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    let map = new Map()
    for (let str of strs) {
        let newStr = str.split('').sort().join('')
        if (map.has(newStr)) {
            map.set(newStr, [...map.get(newStr), str])
        } else {
            map.set(newStr, [str])
        }
    }
    return Array.from(map.values())
};

let strs = ["eat", "tea", "tan", "ate", "nat", "bat"]

console.log(groupAnagrams(strs))