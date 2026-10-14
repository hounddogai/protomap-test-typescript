import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedTouchpointNoticeStore } from "./weighted-touchpoint-notice-store.js";
import { newWeightedTouchpointNotice } from "./weighted-touchpoint-notice.js";

test("MemoryWeightedTouchpointNoticeStore finds what it saved", () => {
  const store = newMemoryWeightedTouchpointNoticeStore();
  const item = newWeightedTouchpointNotice("code-714", "name-765");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
