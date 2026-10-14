import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightTargetStore } from "./insight-target-store.js";
import { newInsightTarget } from "./insight-target.js";

test("MemoryInsightTargetStore finds what it saved", () => {
  const store = newMemoryInsightTargetStore();
  const item = newInsightTarget("code-698", "name-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
