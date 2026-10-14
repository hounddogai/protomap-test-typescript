import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitBaselineStore } from "./wait-baseline-store.js";
import { newWaitBaseline } from "./wait-baseline.js";

test("MemoryWaitBaselineStore finds what it saved", () => {
  const store = newMemoryWaitBaselineStore();
  const item = newWaitBaseline("code-269", "label-565");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
