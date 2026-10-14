import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFrequencyNoticeStore } from "./scheduled-frequency-notice-store.js";
import { newScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

test("MemoryScheduledFrequencyNoticeStore finds what it saved", () => {
  const store = newMemoryScheduledFrequencyNoticeStore();
  const item = newScheduledFrequencyNotice("code-600", "label-600");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
