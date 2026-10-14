import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingQuotaStore } from "./pacing-quota-store.js";
import { newPacingQuota } from "./pacing-quota.js";

test("MemoryPacingQuotaStore finds what it saved", () => {
  const store = newMemoryPacingQuotaStore();
  const item = newPacingQuota("code-288", "label-166");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
