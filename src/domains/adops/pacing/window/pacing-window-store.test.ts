import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingWindowStore } from "./pacing-window-store.js";
import { newPacingWindow } from "./pacing-window.js";

test("MemoryPacingWindowStore finds what it saved", () => {
  const store = newMemoryPacingWindowStore();
  const item = newPacingWindow("code-400", "title-443");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
