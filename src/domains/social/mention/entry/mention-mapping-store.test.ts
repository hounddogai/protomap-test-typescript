import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionMappingStore } from "./mention-mapping-store.js";
import { newMentionMapping } from "./mention-mapping.js";

test("MemoryMentionMappingStore finds what it saved", () => {
  const store = newMemoryMentionMappingStore();
  const item = newMentionMapping("code-891", "name-893");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
