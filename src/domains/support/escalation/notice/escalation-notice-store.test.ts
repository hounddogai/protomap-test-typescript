import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationNoticeStore } from "./escalation-notice-store.js";
import { newEscalationNotice } from "./escalation-notice.js";

test("MemoryEscalationNoticeStore finds what it saved", () => {
  const store = newMemoryEscalationNoticeStore();
  const item = newEscalationNotice("code-556", "title-867");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
