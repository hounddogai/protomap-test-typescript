import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementNoticeStore } from "./placement-notice-store.js";
import { newPlacementNotice } from "./placement-notice.js";

test("MemoryPlacementNoticeStore finds what it saved", () => {
  const store = newMemoryPlacementNoticeStore();
  const item = newPlacementNotice("code-314", "name-77");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
