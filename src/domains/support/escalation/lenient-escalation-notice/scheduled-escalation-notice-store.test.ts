import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledEscalationNoticeStore } from "./scheduled-escalation-notice-store.js";
import { newScheduledEscalationNotice } from "./scheduled-escalation-notice.js";

test("MemoryScheduledEscalationNoticeStore finds what it saved", () => {
  const store = newMemoryScheduledEscalationNoticeStore();
  const item = newScheduledEscalationNotice("code-313", "label-498");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
