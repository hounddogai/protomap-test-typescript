import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveSlaMappingStore } from "./adaptive-sla-mapping-store.js";
import { newAdaptiveSlaMapping } from "./adaptive-sla-mapping.js";

test("MemoryAdaptiveSlaMappingStore finds what it saved", () => {
  const store = newMemoryAdaptiveSlaMappingStore();
  const item = newAdaptiveSlaMapping("code-751", "title-104");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
