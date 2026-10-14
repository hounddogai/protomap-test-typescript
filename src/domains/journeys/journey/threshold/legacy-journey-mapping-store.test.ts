import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyJourneyMappingStore } from "./legacy-journey-mapping-store.js";
import { newLegacyJourneyMapping } from "./legacy-journey-mapping.js";

test("MemoryLegacyJourneyMappingStore finds what it saved", () => {
  const store = newMemoryLegacyJourneyMappingStore();
  const item = newLegacyJourneyMapping("code-786", "label-534");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
