import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPacingMappingStore } from "./legacy-pacing-mapping-store.js";
import { newLegacyPacingMapping } from "./legacy-pacing-mapping.js";

test("MemoryLegacyPacingMappingStore finds what it saved", () => {
  const store = newMemoryLegacyPacingMappingStore();
  const item = newLegacyPacingMapping("code-936", "title-472");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
