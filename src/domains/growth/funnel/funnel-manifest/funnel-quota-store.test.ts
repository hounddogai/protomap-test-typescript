import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelQuotaStore } from "./funnel-quota-store.js";
import { newFunnelQuota } from "./funnel-quota.js";

test("MemoryFunnelQuotaStore finds what it saved", () => {
  const store = newMemoryFunnelQuotaStore();
  const item = newFunnelQuota("code-965", "label-582");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
