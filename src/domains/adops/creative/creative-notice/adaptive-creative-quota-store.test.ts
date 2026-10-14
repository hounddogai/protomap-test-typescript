import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCreativeQuotaStore } from "./adaptive-creative-quota-store.js";
import { newAdaptiveCreativeQuota } from "./adaptive-creative-quota.js";

test("MemoryAdaptiveCreativeQuotaStore finds what it saved", () => {
  const store = newMemoryAdaptiveCreativeQuotaStore();
  const item = newAdaptiveCreativeQuota("code-254", "label-587");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
