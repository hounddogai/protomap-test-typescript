import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalDeflectionBaselineStore } from "./global-deflection-baseline-store.js";
import { newGlobalDeflectionBaseline } from "./global-deflection-baseline.js";

test("MemoryGlobalDeflectionBaselineStore finds what it saved", () => {
  const store = newMemoryGlobalDeflectionBaselineStore();
  const item = newGlobalDeflectionBaseline("code-735", "label-547");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
