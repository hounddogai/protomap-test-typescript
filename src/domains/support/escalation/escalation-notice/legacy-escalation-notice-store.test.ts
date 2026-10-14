import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyEscalationNoticeStore } from "./legacy-escalation-notice-store.js";
import { newLegacyEscalationNotice } from "./legacy-escalation-notice.js";

test("MemoryLegacyEscalationNoticeStore finds what it saved", () => {
  const store = newMemoryLegacyEscalationNoticeStore();
  const item = newLegacyEscalationNotice("code-954", "label-732");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
