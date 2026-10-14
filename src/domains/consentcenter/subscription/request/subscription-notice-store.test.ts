import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionNoticeStore } from "./subscription-notice-store.js";
import { newSubscriptionNotice } from "./subscription-notice.js";

test("MemorySubscriptionNoticeStore finds what it saved", () => {
  const store = newMemorySubscriptionNoticeStore();
  const item = newSubscriptionNotice("code-804", "title-291");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
