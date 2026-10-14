import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTierWindowStore } from "./manual-tier-window-store.js";
import { newManualTierWindow } from "./manual-tier-window.js";

test("MemoryManualTierWindowStore finds what it saved", () => {
  const store = newMemoryManualTierWindowStore();
  const item = newManualTierWindow("code-104", "title-706");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
