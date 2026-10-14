import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintException } from "./complaint-exception.js";

test("ComplaintException starts in new", () => {
  const item = newComplaintException("code-899", "name-823");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintException moves to done", () => {
  const item = newComplaintException("code-899", "name-823");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ComplaintException rejects moves from failed", () => {
  const item = newComplaintException("code-899", "name-823");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
