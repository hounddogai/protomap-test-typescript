import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedReplyQuotaStore } from "./capped-reply-quota-store.js";
import { newCappedReplyQuota } from "./capped-reply-quota.js";

test("MemoryCappedReplyQuotaStore finds what it saved", () => {
  const store = newMemoryCappedReplyQuotaStore();
  const item = newCappedReplyQuota("code-960", "label-874");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
