import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBranchPolicy } from "./global-branch-policy.js";

test("GlobalBranchPolicy starts in proposed", () => {
  const item = newGlobalBranchPolicy("code-868", "name-490");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBranchPolicy moves to approved", () => {
  const item = newGlobalBranchPolicy("code-868", "name-490");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalBranchPolicy rejects moves from withdrawn", () => {
  const item = newGlobalBranchPolicy("code-868", "name-490");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
