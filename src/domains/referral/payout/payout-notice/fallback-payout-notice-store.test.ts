import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPayoutNoticeStore } from "./fallback-payout-notice-store.js";
import { newFallbackPayoutNotice } from "./fallback-payout-notice.js";

test("MemoryFallbackPayoutNoticeStore finds what it saved", () => {
  const store = newMemoryFallbackPayoutNoticeStore();
  const item = newFallbackPayoutNotice("code-712", "name-565");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
