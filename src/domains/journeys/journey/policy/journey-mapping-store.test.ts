import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyMappingStore } from "./journey-mapping-store.js";
import { newJourneyMapping } from "./journey-mapping.js";

test("MemoryJourneyMappingStore finds what it saved", () => {
  const store = newMemoryJourneyMappingStore();
  const item = newJourneyMapping("code-399", "title-640");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
