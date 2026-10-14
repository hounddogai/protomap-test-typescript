import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyWindowStore } from "./frequency-window-store.js";
import { newFrequencyWindow } from "./frequency-window.js";

test("MemoryFrequencyWindowStore finds what it saved", () => {
  const store = newMemoryFrequencyWindowStore();
  const item = newFrequencyWindow("code-413", "title-309");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
