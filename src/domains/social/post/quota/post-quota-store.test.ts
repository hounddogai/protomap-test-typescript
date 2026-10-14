import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostQuotaStore } from "./post-quota-store.js";
import { newPostQuota } from "./post-quota.js";

test("MemoryPostQuotaStore finds what it saved", () => {
  const store = newMemoryPostQuotaStore();
  const item = newPostQuota("code-876", "label-63");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
