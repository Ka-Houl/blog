var lengthOfLongestSubstring = function(s) {
    let start = 0
    let end = 1
    let maxLen = 0
    while (end <= s.length && start < end) {
        let str = s.slice(start, end)
        if (hadSameChat(str)) {
            start++
        } else {
            maxLen = maxLen < str.length ? str.length : maxLen
            end++
        } 
    }
    return maxLen

    function hadSameChat (s) {        
        return s.slice(0,-1).indexOf(s.slice(-1))> -1
    }
};

console.log(lengthOfLongestSubstring('abbcdd'))
