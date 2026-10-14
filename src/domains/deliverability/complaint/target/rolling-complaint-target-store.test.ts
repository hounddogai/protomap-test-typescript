import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingComplaintTargetStore } from "./rolling-complaint-target-store.js";
import { newRollingComplaintTarget } from "./rolling-complaint-target.js";

test("MemoryRollingComplaintTargetStore finds what it saved", () => {
  const store = newMemoryRollingComplaintTargetStore();
  const item = newRollingComplaintTarget("code-612", "name-251");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
