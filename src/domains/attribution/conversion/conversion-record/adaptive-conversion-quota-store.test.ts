import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveConversionQuotaStore } from "./adaptive-conversion-quota-store.js";
import { newAdaptiveConversionQuota } from "./adaptive-conversion-quota.js";

test("MemoryAdaptiveConversionQuotaStore finds what it saved", () => {
  const store = newMemoryAdaptiveConversionQuotaStore();
  const item = newAdaptiveConversionQuota("code-962", "title-315");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
