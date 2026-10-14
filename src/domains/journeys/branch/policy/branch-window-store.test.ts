import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchWindowStore } from "./branch-window-store.js";
import { newBranchWindow } from "./branch-window.js";

test("MemoryBranchWindowStore finds what it saved", () => {
  const store = newMemoryBranchWindowStore();
  const item = newBranchWindow("code-702", "name-640");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
