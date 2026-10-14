import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledStreakQuotaStore } from "./scheduled-streak-quota-store.js";
import { newScheduledStreakQuota } from "./scheduled-streak-quota.js";

test("MemoryScheduledStreakQuotaStore finds what it saved", () => {
  const store = newMemoryScheduledStreakQuotaStore();
  const item = newScheduledStreakQuota("code-785", "title-351");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
