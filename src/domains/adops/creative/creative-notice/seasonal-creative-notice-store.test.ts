import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCreativeNoticeStore } from "./seasonal-creative-notice-store.js";
import { newSeasonalCreativeNotice } from "./seasonal-creative-notice.js";

test("MemorySeasonalCreativeNoticeStore finds what it saved", () => {
  const store = newMemorySeasonalCreativeNoticeStore();
  const item = newSeasonalCreativeNotice("code-661", "name-557");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
