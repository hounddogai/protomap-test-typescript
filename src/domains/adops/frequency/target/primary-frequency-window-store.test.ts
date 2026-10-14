import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFrequencyWindowStore } from "./primary-frequency-window-store.js";
import { newPrimaryFrequencyWindow } from "./primary-frequency-window.js";

test("MemoryPrimaryFrequencyWindowStore finds what it saved", () => {
  const store = newMemoryPrimaryFrequencyWindowStore();
  const item = newPrimaryFrequencyWindow("code-839", "name-689");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
