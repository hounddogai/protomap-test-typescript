import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWaitWindowStore } from "./weighted-wait-window-store.js";
import { newWeightedWaitWindow } from "./weighted-wait-window.js";

test("MemoryWeightedWaitWindowStore finds what it saved", () => {
  const store = newMemoryWeightedWaitWindowStore();
  const item = newWeightedWaitWindow("code-231", "label-31");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
