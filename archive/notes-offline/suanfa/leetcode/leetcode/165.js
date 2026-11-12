var compareVersion = function(version1, version2) {
    let list1 = version1.split('.')
    let list2 = version2.split('.')
    let len = Math.max(list1.length, list2.length)
    let i = 0
    while(i< len) {
        list1[i] = Number(list1[i] || 0)
        list2[i] = Number(list2[i] || 0)
        if (list1[i]>list2[i]) {
            return 1
        }
        if (list1[i]<list2[i]) {
            return -1
        }
        i++
    }
    return 0
};

console.log(compareVersion("1.01", "1.001"))