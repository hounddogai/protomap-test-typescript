import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPacingMappingStore } from "./manual-pacing-mapping-store.js";
import { newManualPacingMapping } from "./manual-pacing-mapping.js";

test("MemoryManualPacingMappingStore finds what it saved", () => {
  const store = newMemoryManualPacingMappingStore();
  const item = newManualPacingMapping("code-949", "label-638");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
