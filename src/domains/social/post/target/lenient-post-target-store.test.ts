import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPostTargetStore } from "./lenient-post-target-store.js";
import { newLenientPostTarget } from "./lenient-post-target.js";

test("MemoryLenientPostTargetStore finds what it saved", () => {
  const store = newMemoryLenientPostTargetStore();
  const item = newLenientPostTarget("code-629", "name-976");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
