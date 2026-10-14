import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFraudCheckWindowStore } from "./manual-fraud-check-window-store.js";
import { newManualFraudCheckWindow } from "./manual-fraud-check-window.js";

test("MemoryManualFraudCheckWindowStore finds what it saved", () => {
  const store = newMemoryManualFraudCheckWindowStore();
  const item = newManualFraudCheckWindow("code-130", "label-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
