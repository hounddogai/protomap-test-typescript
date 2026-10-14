import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyWindowStore } from "./journey-window-store.js";
import { newJourneyWindow } from "./journey-window.js";

test("MemoryJourneyWindowStore finds what it saved", () => {
  const store = newMemoryJourneyWindowStore();
  const item = newJourneyWindow("code-948", "name-753");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
