import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightQuotaStore } from "./flight-quota-store.js";
import { newFlightQuota } from "./flight-quota.js";

test("MemoryFlightQuotaStore finds what it saved", () => {
  const store = newMemoryFlightQuotaStore();
  const item = newFlightQuota("code-666", "name-342");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
