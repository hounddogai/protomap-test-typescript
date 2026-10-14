import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofMilestoneStore } from "./proof-milestone-store.js";
import { newProofMilestone } from "./proof-milestone.js";

test("MemoryProofMilestoneStore finds what it saved", () => {
  const store = newMemoryProofMilestoneStore();
  const item = newProofMilestone("code-194", "name-276");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
