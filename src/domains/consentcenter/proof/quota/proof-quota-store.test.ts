import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofQuotaStore } from "./proof-quota-store.js";
import { newProofQuota } from "./proof-quota.js";

test("MemoryProofQuotaStore finds what it saved", () => {
  const store = newMemoryProofQuotaStore();
  const item = newProofQuota("code-484", "name-544");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
