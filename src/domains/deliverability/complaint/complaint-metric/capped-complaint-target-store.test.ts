import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedComplaintTargetStore } from "./capped-complaint-target-store.js";
import { newCappedComplaintTarget } from "./capped-complaint-target.js";

test("MemoryCappedComplaintTargetStore finds what it saved", () => {
  const store = newMemoryCappedComplaintTargetStore();
  const item = newCappedComplaintTarget("code-978", "name-741");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
