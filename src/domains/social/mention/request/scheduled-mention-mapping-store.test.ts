import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledMentionMappingStore } from "./scheduled-mention-mapping-store.js";
import { newScheduledMentionMapping } from "./scheduled-mention-mapping.js";

test("MemoryScheduledMentionMappingStore finds what it saved", () => {
  const store = newMemoryScheduledMentionMappingStore();
  const item = newScheduledMentionMapping("code-966", "label-507");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
