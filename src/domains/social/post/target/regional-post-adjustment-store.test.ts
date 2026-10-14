import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPostAdjustmentStore } from "./regional-post-adjustment-store.js";
import { newRegionalPostAdjustment } from "./regional-post-adjustment.js";

test("MemoryRegionalPostAdjustmentStore finds what it saved", () => {
  const store = newMemoryRegionalPostAdjustmentStore();
  const item = newRegionalPostAdjustment("code-129", "label-579");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
