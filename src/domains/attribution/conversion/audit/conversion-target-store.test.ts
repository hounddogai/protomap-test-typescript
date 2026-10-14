import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionTargetStore } from "./conversion-target-store.js";
import { newConversionTarget } from "./conversion-target.js";

test("MemoryConversionTargetStore finds what it saved", () => {
  const store = newMemoryConversionTargetStore();
  const item = newConversionTarget("code-471", "name-285");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
