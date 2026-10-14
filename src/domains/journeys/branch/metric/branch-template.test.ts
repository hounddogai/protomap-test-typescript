import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchTemplate } from "./branch-template.js";

test("BranchTemplate starts in planned", () => {
  const item = newBranchTemplate("code-752", "name-188");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchTemplate moves to in progress", () => {
  const item = newBranchTemplate("code-752", "name-188");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BranchTemplate rejects moves from cancelled", () => {
  const item = newBranchTemplate("code-752", "name-188");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
