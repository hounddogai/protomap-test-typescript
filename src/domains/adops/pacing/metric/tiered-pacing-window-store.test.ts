import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPacingWindowStore } from "./tiered-pacing-window-store.js";
import { newTieredPacingWindow } from "./tiered-pacing-window.js";

test("MemoryTieredPacingWindowStore finds what it saved", () => {
  const store = newMemoryTieredPacingWindowStore();
  const item = newTieredPacingWindow("code-850", "label-204");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
