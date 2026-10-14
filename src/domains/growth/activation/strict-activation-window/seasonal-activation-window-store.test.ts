import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalActivationWindowStore } from "./seasonal-activation-window-store.js";
import { newSeasonalActivationWindow } from "./seasonal-activation-window.js";

test("MemorySeasonalActivationWindowStore finds what it saved", () => {
  const store = newMemorySeasonalActivationWindowStore();
  const item = newSeasonalActivationWindow("code-305", "title-529");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
