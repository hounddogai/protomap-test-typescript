import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveBounceGroupStore } from "./adaptive-bounce-group-store.js";
import { newAdaptiveBounceGroup } from "./adaptive-bounce-group.js";

test("MemoryAdaptiveBounceGroupStore finds what it saved", () => {
  const store = newMemoryAdaptiveBounceGroupStore();
  const item = newAdaptiveBounceGroup("code-1", "title-230");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
