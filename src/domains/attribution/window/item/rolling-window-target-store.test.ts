import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingWindowTargetStore } from "./rolling-window-target-store.js";
import { newRollingWindowTarget } from "./rolling-window-target.js";

test("MemoryRollingWindowTargetStore finds what it saved", () => {
  const store = newMemoryRollingWindowTargetStore();
  const item = newRollingWindowTarget("code-993", "title-807");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
