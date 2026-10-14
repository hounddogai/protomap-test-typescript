import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleAssignmentStore } from "./bid-rule-assignment-store.js";
import { newBidRuleAssignment } from "./bid-rule-assignment.js";

test("MemoryBidRuleAssignmentStore finds what it saved", () => {
  const store = newMemoryBidRuleAssignmentStore();
  const item = newBidRuleAssignment("code-795", "title-674");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
