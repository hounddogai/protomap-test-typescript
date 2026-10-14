import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPathAdjustmentStore } from "./default-path-adjustment-store.js";
import { newDefaultPathAdjustment } from "./default-path-adjustment.js";

test("MemoryDefaultPathAdjustmentStore finds what it saved", () => {
  const store = newMemoryDefaultPathAdjustmentStore();
  const item = newDefaultPathAdjustment("code-789", "title-175");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
