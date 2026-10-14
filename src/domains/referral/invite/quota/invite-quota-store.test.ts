import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteQuotaStore } from "./invite-quota-store.js";
import { newInviteQuota } from "./invite-quota.js";

test("MemoryInviteQuotaStore finds what it saved", () => {
  const store = newMemoryInviteQuotaStore();
  const item = newInviteQuota("code-888", "title-684");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
