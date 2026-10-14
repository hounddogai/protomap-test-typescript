import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedSlaQuotaStore } from "./capped-sla-quota-store.js";
import { newCappedSlaQuota } from "./capped-sla-quota.js";

test("MemoryCappedSlaQuotaStore finds what it saved", () => {
  const store = newMemoryCappedSlaQuotaStore();
  const item = newCappedSlaQuota("code-196", "title-829");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
