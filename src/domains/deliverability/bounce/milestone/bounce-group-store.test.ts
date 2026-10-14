import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceGroupStore } from "./bounce-group-store.js";
import { newBounceGroup } from "./bounce-group.js";

test("MemoryBounceGroupStore finds what it saved", () => {
  const store = newMemoryBounceGroupStore();
  const item = newBounceGroup("code-354", "label-396");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
