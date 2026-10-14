import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveSubscriptionWindowStore } from "./adaptive-subscription-window-store.js";
import { newAdaptiveSubscriptionWindow } from "./adaptive-subscription-window.js";

test("MemoryAdaptiveSubscriptionWindowStore finds what it saved", () => {
  const store = newMemoryAdaptiveSubscriptionWindowStore();
  const item = newAdaptiveSubscriptionWindow("code-551", "title-915");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
