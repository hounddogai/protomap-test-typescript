import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPlacementNoticeStore } from "./scheduled-placement-notice-store.js";
import { newScheduledPlacementNotice } from "./scheduled-placement-notice.js";

test("MemoryScheduledPlacementNoticeStore finds what it saved", () => {
  const store = newMemoryScheduledPlacementNoticeStore();
  const item = newScheduledPlacementNotice("code-244", "label-126");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
