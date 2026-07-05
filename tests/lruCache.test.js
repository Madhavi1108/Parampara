const assert = require('assert');
const LRUCache = require('../server/utils/lruCache');

// 1. Test basic get/set and capacity limit (eviction)
const cache = new LRUCache(3);

cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);
assert.strictEqual(cache.size, 3, "Size should be 3");

// 'a' is LRU. adding 'd' should evict 'a'
cache.set('d', 4);
assert.strictEqual(cache.size, 3, "Size should be 3 after eviction");
assert.strictEqual(cache.has('a'), false, "'a' should be evicted");
assert.strictEqual(cache.get('b'), 2, "'b' should still exist");

// Now 'c' is LRU (since 'b' was just accessed). adding 'e' should evict 'c'
cache.set('e', 5);
assert.strictEqual(cache.has('c'), false, "'c' should be evicted");
assert.strictEqual(cache.get('b'), 2, "'b' should still exist");

// 2. Test Array Compatibility Methods
const arrayCache = new LRUCache(5);
arrayCache.push({ id: 'item1', value: 10 });
arrayCache.push({ id: 'item2', value: 20 });
arrayCache.push({ id: 'item3', value: 30 });

assert.strictEqual(arrayCache.length, 3, "Length should match push count");

// Filter
const filtered = arrayCache.filter(item => item.value > 15);
assert.strictEqual(filtered.length, 2, "Filter should return 2 items");

// Map
const mapped = arrayCache.map(item => item.value * 2);
assert.deepStrictEqual(mapped, [20, 40, 60], "Map should double values");

// Find
const found = arrayCache.find(item => item.id === 'item2');
assert.strictEqual(found.value, 20, "Find should return the correct item");

// Reduce
const sum = arrayCache.reduce((acc, item) => acc + item.value, 0);
assert.strictEqual(sum, 60, "Reduce should sum values correctly");

// ForEach
let count = 0;
arrayCache.forEach(() => count++);
assert.strictEqual(count, 3, "ForEach should iterate over all items");

console.log("All LRUCache tests passed successfully!");
