/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var permute = function(nums) {
    let res = []

    function loop(hadList, restList) {
        if (restList.length === 0) {
            res.push(hadList)
        } else {
            let copyRestList = [...restList]
            for (let i in copyRestList) {
                loop([...hadList, copyRestList[i]], copyRestList.toSpliced(i, 1))
            }
        }
    }

    loop([], nums)
    return res
};

console.log(permute( [1,2,3]))