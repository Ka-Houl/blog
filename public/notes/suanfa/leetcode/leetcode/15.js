/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let len = nums.length
    nums = nums.sort((a, b) => a-b)
    let resList = []
    let i = -1
    while (i< len) {
        i++
        if (nums[i] > 0) {
            break
        }
        if (nums[i] === nums[i-1]) {
            continue
        }
        let L = i+1
        let R = len-1
        while(L<R) {
            console.log(nums[i], nums[L], nums[R])
            let sum = nums[i]+nums[L]+nums[R]
            if(nums[L] === nums[L-1] && L>i+1) {
                L++
                continue
            }
            if (nums[R] === nums[R+1]) {
                R--
                continue
            }
            if (sum === 0) {
                resList.push([nums[i], nums[L], nums[R]])
                L++
                R--
            } else if (sum < 0) {
                L++
            } else if (sum > 0) {
                R--
            }
        }
    }
    return resList
};

console.log(threeSum([-1,0,1,2,-1,-4,0,0]))
