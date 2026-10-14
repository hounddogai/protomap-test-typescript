import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofMappingStore } from "./proof-mapping-store.js";
import { newProofMapping } from "./proof-mapping.js";

test("MemoryProofMappingStore finds what it saved", () => {
  const store = newMemoryProofMappingStore();
  const item = newProofMapping("code-360", "label-755");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
