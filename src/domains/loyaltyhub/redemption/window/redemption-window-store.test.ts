import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionWindowStore } from "./redemption-window-store.js";
import { newRedemptionWindow } from "./redemption-window.js";

test("MemoryRedemptionWindowStore finds what it saved", () => {
  const store = newMemoryRedemptionWindowStore();
  const item = newRedemptionWindow("code-828", "title-281");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
