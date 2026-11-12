var merge = function(nums1, m, nums2, n) {
    nums1.splice(m, nums1.length-m, ...nums2)
    nums1.sort((a,b) => a-b)
};

let nums1 = [1,2,3,0,0,0] 
let m = 3 
let nums2 = [2,5,6]
let n = 3
merge(nums1, m, nums2, n)
console.log(nums1)