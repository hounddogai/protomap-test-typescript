import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPayoutNoticeStore } from "./scheduled-payout-notice-store.js";
import { newScheduledPayoutNotice } from "./scheduled-payout-notice.js";

test("MemoryScheduledPayoutNoticeStore finds what it saved", () => {
  const store = newMemoryScheduledPayoutNoticeStore();
  const item = newScheduledPayoutNotice("code-754", "title-267");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
