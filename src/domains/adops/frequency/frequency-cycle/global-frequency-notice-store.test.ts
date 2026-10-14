import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFrequencyNoticeStore } from "./global-frequency-notice-store.js";
import { newGlobalFrequencyNotice } from "./global-frequency-notice.js";

test("MemoryGlobalFrequencyNoticeStore finds what it saved", () => {
  const store = newMemoryGlobalFrequencyNoticeStore();
  const item = newGlobalFrequencyNotice("code-257", "name-596");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
