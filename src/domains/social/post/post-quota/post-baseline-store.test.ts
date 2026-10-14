import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostBaselineStore } from "./post-baseline-store.js";
import { newPostBaseline } from "./post-baseline.js";

test("MemoryPostBaselineStore finds what it saved", () => {
  const store = newMemoryPostBaselineStore();
  const item = newPostBaseline("code-459", "title-154");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
