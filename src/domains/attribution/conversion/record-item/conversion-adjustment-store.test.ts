import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionAdjustmentStore } from "./conversion-adjustment-store.js";
import { newConversionAdjustment } from "./conversion-adjustment.js";

test("MemoryConversionAdjustmentStore finds what it saved", () => {
  const store = newMemoryConversionAdjustmentStore();
  const item = newConversionAdjustment("code-861", "title-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
