import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingMacroCycleStore } from "./rolling-macro-cycle-store.js";
import { newRollingMacroCycle } from "./rolling-macro-cycle.js";

test("MemoryRollingMacroCycleStore finds what it saved", () => {
  const store = newMemoryRollingMacroCycleStore();
  const item = newRollingMacroCycle("code-273", "label-872");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
