import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyQuotaStore } from "./reply-quota-store.js";
import { newReplyQuota } from "./reply-quota.js";

test("MemoryReplyQuotaStore finds what it saved", () => {
  const store = newMemoryReplyQuotaStore();
  const item = newReplyQuota("code-181", "label-486");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
