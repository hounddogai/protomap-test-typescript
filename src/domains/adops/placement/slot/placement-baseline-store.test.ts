import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementBaselineStore } from "./placement-baseline-store.js";
import { newPlacementBaseline } from "./placement-baseline.js";

test("MemoryPlacementBaselineStore finds what it saved", () => {
  const store = newMemoryPlacementBaselineStore();
  const item = newPlacementBaseline("code-828", "label-396");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
