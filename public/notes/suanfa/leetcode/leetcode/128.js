/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    let set = new Set(nums)
    let max = 0

    for (let i = 0; i< nums.length; i++) {
        let item = nums[i]

        if (!set.has(item - 1)) {
            // 说明是起始位置
            let count = 1
            while(set.has(item + 1)) {
                count++
                item++
            }
            max = Math.max(max, count)
        }
    }
    return max
};