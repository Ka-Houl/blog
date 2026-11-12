/**
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */
var longestCommonSubsequence = function(text1, text2) {
    let m = text1.length
    let n = text2.length
    let dp = new Array(m+1).fill('').map(item => new Array(n+1).fill(0))

    for (let i = 1; i<= m; i++) {
        for (let j = 1; j<= n; j++) {
            console.log(text1[i] , text2[j], dp)
            if (text1[i-1] === text2[j-1]) {
                dp[i][j] = dp[i-1][j-1]+1
            } else{
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1])
            }
        }
    }

    return dp[m][n]


};

console.log(longestCommonSubsequence('abcde', 'ace'))