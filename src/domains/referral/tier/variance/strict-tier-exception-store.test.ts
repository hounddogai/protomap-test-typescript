import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTierExceptionStore } from "./strict-tier-exception-store.js";
import { newStrictTierException } from "./strict-tier-exception.js";

test("MemoryStrictTierExceptionStore finds what it saved", () => {
  const store = newMemoryStrictTierExceptionStore();
  const item = newStrictTierException("code-364", "label-89");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
