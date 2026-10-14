import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointTargetStore } from "./touchpoint-target-store.js";
import { newTouchpointTarget } from "./touchpoint-target.js";

test("MemoryTouchpointTargetStore finds what it saved", () => {
  const store = newMemoryTouchpointTargetStore();
  const item = newTouchpointTarget("code-989", "name-841");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
