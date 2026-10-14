import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathBaselineStore } from "./path-baseline-store.js";
import { newPathBaseline } from "./path-baseline.js";

test("MemoryPathBaselineStore finds what it saved", () => {
  const store = newMemoryPathBaselineStore();
  const item = newPathBaseline("code-802", "label-448");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
