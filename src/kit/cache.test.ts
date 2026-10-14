import assert from "node:assert/strict";
import { test } from "node:test";
import * as cache from "./cache.js";
import * as clock from "./clock.js";

test("Cache evicts the oldest entry", () => {
  const cacheValue = cache.newTtlCache<string>(2, 60, new clock.FixedClock(1000));
  cacheValue.put("a", "1");
  cacheValue.put("b", "2");
  cacheValue.put("c", "3");
  assert.equal(cacheValue.size(), 2, "size");
});

test("Cache forgets expired entries", () => {
  const clockValue = new clock.StepClock(0, 100);
  const cacheValue = cache.newTtlCache<string>(8, 150, clockValue);
  cacheValue.put("key", "value");
  assert.equal(cacheValue.purgeExpired(), 0, "purged early");
  assert.equal(cacheValue.purgeExpired(), 1, "purged late");
});
