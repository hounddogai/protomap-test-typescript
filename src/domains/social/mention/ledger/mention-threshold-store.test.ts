import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionThresholdStore } from "./mention-threshold-store.js";
import { newMentionThreshold } from "./mention-threshold.js";

test("MemoryMentionThresholdStore finds what it saved", () => {
  const store = newMemoryMentionThresholdStore();
  const item = newMentionThreshold("code-661", "title-791");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
