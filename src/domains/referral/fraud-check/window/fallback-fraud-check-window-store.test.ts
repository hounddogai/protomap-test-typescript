import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFraudCheckWindowStore } from "./fallback-fraud-check-window-store.js";
import { newFallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

test("MemoryFallbackFraudCheckWindowStore finds what it saved", () => {
  const store = newMemoryFallbackFraudCheckWindowStore();
  const item = newFallbackFraudCheckWindow("code-199", "name-177");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
