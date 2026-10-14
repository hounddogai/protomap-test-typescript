import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintGroup } from "./complaint-group.js";

test("ComplaintGroup starts in new", () => {
  const item = newComplaintGroup("code-278", "name-881");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintGroup moves to done", () => {
  const item = newComplaintGroup("code-278", "name-881");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ComplaintGroup rejects moves from failed", () => {
  const item = newComplaintGroup("code-278", "name-881");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
