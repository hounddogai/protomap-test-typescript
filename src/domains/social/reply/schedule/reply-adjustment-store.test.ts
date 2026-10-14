import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyAdjustmentStore } from "./reply-adjustment-store.js";
import { newReplyAdjustment } from "./reply-adjustment.js";

test("MemoryReplyAdjustmentStore finds what it saved", () => {
  const store = newMemoryReplyAdjustmentStore();
  const item = newReplyAdjustment("code-354", "name-242");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
