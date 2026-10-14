import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceNoticeStore } from "./preference-notice-store.js";
import { newPreferenceNotice } from "./preference-notice.js";

test("MemoryPreferenceNoticeStore finds what it saved", () => {
  const store = newMemoryPreferenceNoticeStore();
  const item = newPreferenceNotice("code-291", "name-475");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
