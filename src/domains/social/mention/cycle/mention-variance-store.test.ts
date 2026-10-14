import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionVarianceStore } from "./mention-variance-store.js";
import { newMentionVariance } from "./mention-variance.js";

test("MemoryMentionVarianceStore finds what it saved", () => {
  const store = newMemoryMentionVarianceStore();
  const item = newMentionVariance("code-72", "label-42");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
