import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingTouchpointTargetStore } from "./rolling-touchpoint-target-store.js";
import { newRollingTouchpointTarget } from "./rolling-touchpoint-target.js";

test("MemoryRollingTouchpointTargetStore finds what it saved", () => {
  const store = newMemoryRollingTouchpointTargetStore();
  const item = newRollingTouchpointTarget("code-608", "name-84");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
