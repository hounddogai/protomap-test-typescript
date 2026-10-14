import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSuppressionGroupStore } from "./fallback-suppression-group-store.js";
import { newFallbackSuppressionGroup } from "./fallback-suppression-group.js";

test("MemoryFallbackSuppressionGroupStore finds what it saved", () => {
  const store = newMemoryFallbackSuppressionGroupStore();
  const item = newFallbackSuppressionGroup("code-866", "label-571");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
