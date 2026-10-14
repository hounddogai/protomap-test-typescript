import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingRedemptionWindowStore } from "./rolling-redemption-window-store.js";
import { newRollingRedemptionWindow } from "./rolling-redemption-window.js";

test("MemoryRollingRedemptionWindowStore finds what it saved", () => {
  const store = newMemoryRollingRedemptionWindowStore();
  const item = newRollingRedemptionWindow("code-359", "label-250");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
