import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalProofMappingStore } from "./global-proof-mapping-store.js";
import { newGlobalProofMapping } from "./global-proof-mapping.js";

test("MemoryGlobalProofMappingStore finds what it saved", () => {
  const store = newMemoryGlobalProofMappingStore();
  const item = newGlobalProofMapping("code-830", "label-257");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
