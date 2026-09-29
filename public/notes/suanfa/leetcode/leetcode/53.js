/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let dp = [nums[0]] // 表示以i为结尾的最大结果
    let max = nums[0]
    for (let i = 1; i< nums.length; i++) {
        if (dp[i-1] < 0) {
            dp [i] = nums[i]
        } else{
            dp[i] = dp[i-1]+nums[i]
        }
        max = Math.max(dp[i], max)
    }
    return max
};