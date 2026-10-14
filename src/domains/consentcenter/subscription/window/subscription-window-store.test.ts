import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionWindowStore } from "./subscription-window-store.js";
import { newSubscriptionWindow } from "./subscription-window.js";

test("MemorySubscriptionWindowStore finds what it saved", () => {
  const store = newMemorySubscriptionWindowStore();
  const item = newSubscriptionWindow("code-227", "label-927");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
