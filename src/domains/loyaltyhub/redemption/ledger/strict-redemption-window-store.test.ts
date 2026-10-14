import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictRedemptionWindowStore } from "./strict-redemption-window-store.js";
import { newStrictRedemptionWindow } from "./strict-redemption-window.js";

test("MemoryStrictRedemptionWindowStore finds what it saved", () => {
  const store = newMemoryStrictRedemptionWindowStore();
  const item = newStrictRedemptionWindow("code-991", "title-931");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
