import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeAdjustmentStore } from "./badge-adjustment-store.js";
import { newBadgeAdjustment } from "./badge-adjustment.js";

test("MemoryBadgeAdjustmentStore finds what it saved", () => {
  const store = newMemoryBadgeAdjustmentStore();
  const item = newBadgeAdjustment("code-563", "title-705");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
