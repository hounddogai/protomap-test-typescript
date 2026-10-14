import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceBaselineStore } from "./bounce-baseline-store.js";
import { newBounceBaseline } from "./bounce-baseline.js";

test("MemoryBounceBaselineStore finds what it saved", () => {
  const store = newMemoryBounceBaselineStore();
  const item = newBounceBaseline("code-465", "title-416");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
