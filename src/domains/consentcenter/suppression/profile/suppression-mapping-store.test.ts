import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionMappingStore } from "./suppression-mapping-store.js";
import { newSuppressionMapping } from "./suppression-mapping.js";

test("MemorySuppressionMappingStore finds what it saved", () => {
  const store = newMemorySuppressionMappingStore();
  const item = newSuppressionMapping("code-280", "label-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
