import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredOptOutWindowStore } from "./tiered-opt-out-window-store.js";
import { newTieredOptOutWindow } from "./tiered-opt-out-window.js";

test("MemoryTieredOptOutWindowStore finds what it saved", () => {
  const store = newMemoryTieredOptOutWindowStore();
  const item = newTieredOptOutWindow("code-903", "name-748");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
