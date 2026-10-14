import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientTierWindowStore } from "./lenient-tier-window-store.js";
import { newLenientTierWindow } from "./lenient-tier-window.js";

test("MemoryLenientTierWindowStore finds what it saved", () => {
  const store = newMemoryLenientTierWindowStore();
  const item = newLenientTierWindow("code-517", "name-125");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
