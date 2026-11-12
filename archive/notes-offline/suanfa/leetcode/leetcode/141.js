var hasCycle = function(head) {
    if (!head || !head.next) {return false}
    let cur = head.next
    let next = head.next.next
    while(next && next.next) {
        if (cur === next) {return true}
        cur = cur.next
        next = next.next.next
    }
    return false
};