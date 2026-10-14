import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightMappingStore } from "./flight-mapping-store.js";
import { newFlightMapping } from "./flight-mapping.js";

test("MemoryFlightMappingStore finds what it saved", () => {
  const store = newMemoryFlightMappingStore();
  const item = newFlightMapping("code-350", "name-790");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
