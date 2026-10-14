import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveComplaintGroupStore } from "./adaptive-complaint-group-store.js";
import { newAdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

test("MemoryAdaptiveComplaintGroupStore finds what it saved", () => {
  const store = newMemoryAdaptiveComplaintGroupStore();
  const item = newAdaptiveComplaintGroup("code-142", "name-831");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
