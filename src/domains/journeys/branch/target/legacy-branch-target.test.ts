import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBranchTarget } from "./legacy-branch-target.js";

test("LegacyBranchTarget starts in created", () => {
  const item = newLegacyBranchTarget("code-669", "title-277");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBranchTarget moves to validated", () => {
  const item = newLegacyBranchTarget("code-669", "title-277");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyBranchTarget rejects moves from retired", () => {
  const item = newLegacyBranchTarget("code-669", "title-277");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
