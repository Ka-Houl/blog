/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
    intervals = intervals.sort((a, b) => a[0] - b[0])
    let res = []

    let pre = intervals[0]
    for (let item of intervals) {
        let [a, b] = item
        
        if (pre[1] >= a) {
            // 有重叠
            pre[1] = Math.max(pre[1], b)
        } else{
            res.push(pre)
            pre = item
        }

    }
    res.push(pre)
    return res
    
};

console.log(merge([[1,4],[0,0], [2,5]]))