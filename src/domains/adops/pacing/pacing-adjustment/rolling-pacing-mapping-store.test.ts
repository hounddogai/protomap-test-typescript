import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPacingMappingStore } from "./rolling-pacing-mapping-store.js";
import { newRollingPacingMapping } from "./rolling-pacing-mapping.js";

test("MemoryRollingPacingMappingStore finds what it saved", () => {
  const store = newMemoryRollingPacingMappingStore();
  const item = newRollingPacingMapping("code-298", "label-635");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
