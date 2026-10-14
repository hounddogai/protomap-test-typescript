import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRewardAuditStore } from "./lenient-reward-audit-store.js";
import { newLenientRewardAudit } from "./lenient-reward-audit.js";

test("MemoryLenientRewardAuditStore finds what it saved", () => {
  const store = newMemoryLenientRewardAuditStore();
  const item = newLenientRewardAudit("code-277", "name-15");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
