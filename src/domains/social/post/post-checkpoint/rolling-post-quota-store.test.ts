import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPostQuotaStore } from "./rolling-post-quota-store.js";
import { newRollingPostQuota } from "./rolling-post-quota.js";

test("MemoryRollingPostQuotaStore finds what it saved", () => {
  const store = newMemoryRollingPostQuotaStore();
  const item = newRollingPostQuota("code-590", "label-770");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
