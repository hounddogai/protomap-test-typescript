import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierNoticeStore } from "./tier-notice-store.js";
import { newTierNotice } from "./tier-notice.js";

test("MemoryTierNoticeStore finds what it saved", () => {
  const store = newMemoryTierNoticeStore();
  const item = newTierNotice("code-425", "label-65");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
