import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintCycle } from "./complaint-cycle.js";

test("ComplaintCycle starts in proposed", () => {
  const item = newComplaintCycle("code-102", "label-525");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintCycle moves to rejected", () => {
  const item = newComplaintCycle("code-102", "label-525");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ComplaintCycle rejects moves from withdrawn", () => {
  const item = newComplaintCycle("code-102", "label-525");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
