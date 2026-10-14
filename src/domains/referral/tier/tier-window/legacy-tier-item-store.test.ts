import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyTierItemStore } from "./legacy-tier-item-store.js";
import { newLegacyTierItem } from "./legacy-tier-item.js";

test("MemoryLegacyTierItemStore finds what it saved", () => {
  const store = newMemoryLegacyTierItemStore();
  const item = newLegacyTierItem("code-288", "title-633");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
