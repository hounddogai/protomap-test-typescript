import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitGroupStore } from "./wait-group-store.js";
import { newWaitGroup } from "./wait-group.js";

test("MemoryWaitGroupStore finds what it saved", () => {
  const store = newMemoryWaitGroupStore();
  const item = newWaitGroup("code-626", "title-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
