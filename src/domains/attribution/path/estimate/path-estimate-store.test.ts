import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathEstimateStore } from "./path-estimate-store.js";
import { newPathEstimate } from "./path-estimate.js";

test("MemoryPathEstimateStore finds what it saved", () => {
  const store = newMemoryPathEstimateStore();
  const item = newPathEstimate("code-413", "title-727");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
