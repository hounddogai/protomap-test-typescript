import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCreativeEstimateStore } from "./strict-creative-estimate-store.js";
import { newStrictCreativeEstimate } from "./strict-creative-estimate.js";

test("MemoryStrictCreativeEstimateStore finds what it saved", () => {
  const store = newMemoryStrictCreativeEstimateStore();
  const item = newStrictCreativeEstimate("code-497", "name-448");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
