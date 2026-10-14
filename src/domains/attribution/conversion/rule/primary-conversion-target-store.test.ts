import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryConversionTargetStore } from "./primary-conversion-target-store.js";
import { newPrimaryConversionTarget } from "./primary-conversion-target.js";

test("MemoryPrimaryConversionTargetStore finds what it saved", () => {
  const store = newMemoryPrimaryConversionTargetStore();
  const item = newPrimaryConversionTarget("code-18", "title-358");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
