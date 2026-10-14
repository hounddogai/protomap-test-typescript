import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionAdjustmentStore } from "./mention-adjustment-store.js";
import { newMentionAdjustment } from "./mention-adjustment.js";

test("MemoryMentionAdjustmentStore finds what it saved", () => {
  const store = newMemoryMentionAdjustmentStore();
  const item = newMentionAdjustment("code-365", "label-233");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
