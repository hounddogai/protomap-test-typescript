import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultMentionAdjustmentStore } from "./default-mention-adjustment-store.js";
import { newDefaultMentionAdjustment } from "./default-mention-adjustment.js";

test("MemoryDefaultMentionAdjustmentStore finds what it saved", () => {
  const store = newMemoryDefaultMentionAdjustmentStore();
  const item = newDefaultMentionAdjustment("code-954", "title-246");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
