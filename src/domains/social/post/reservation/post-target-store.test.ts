import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostTargetStore } from "./post-target-store.js";
import { newPostTarget } from "./post-target.js";

test("MemoryPostTargetStore finds what it saved", () => {
  const store = newMemoryPostTargetStore();
  const item = newPostTarget("code-895", "title-774");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
