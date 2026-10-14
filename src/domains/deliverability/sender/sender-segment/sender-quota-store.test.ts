import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderQuotaStore } from "./sender-quota-store.js";
import { newSenderQuota } from "./sender-quota.js";

test("MemorySenderQuotaStore finds what it saved", () => {
  const store = newMemorySenderQuotaStore();
  const item = newSenderQuota("code-289", "label-810");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
