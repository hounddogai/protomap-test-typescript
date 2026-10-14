import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierItemStore } from "./tier-item-store.js";
import { newTierItem } from "./tier-item.js";

test("MemoryTierItemStore finds what it saved", () => {
  const store = newMemoryTierItemStore();
  const item = newTierItem("code-906", "name-171");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
