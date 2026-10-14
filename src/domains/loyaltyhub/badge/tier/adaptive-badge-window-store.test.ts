import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveBadgeWindowStore } from "./adaptive-badge-window-store.js";
import { newAdaptiveBadgeWindow } from "./adaptive-badge-window.js";

test("MemoryAdaptiveBadgeWindowStore finds what it saved", () => {
  const store = newMemoryAdaptiveBadgeWindowStore();
  const item = newAdaptiveBadgeWindow("code-932", "label-822");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
