import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWaitBaselineStore } from "./lenient-wait-baseline-store.js";
import { newLenientWaitBaseline } from "./lenient-wait-baseline.js";

test("MemoryLenientWaitBaselineStore finds what it saved", () => {
  const store = newMemoryLenientWaitBaselineStore();
  const item = newLenientWaitBaseline("code-200", "title-461");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
