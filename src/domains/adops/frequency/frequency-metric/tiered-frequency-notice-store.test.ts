import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFrequencyNoticeStore } from "./tiered-frequency-notice-store.js";
import { newTieredFrequencyNotice } from "./tiered-frequency-notice.js";

test("MemoryTieredFrequencyNoticeStore finds what it saved", () => {
  const store = newMemoryTieredFrequencyNoticeStore();
  const item = newTieredFrequencyNotice("code-354", "title-191");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
