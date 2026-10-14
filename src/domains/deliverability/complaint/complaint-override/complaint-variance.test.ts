import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintVariance } from "./complaint-variance.js";

test("ComplaintVariance starts in proposed", () => {
  const item = newComplaintVariance("code-766", "name-881");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintVariance moves to rejected", () => {
  const item = newComplaintVariance("code-766", "name-881");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ComplaintVariance rejects moves from withdrawn", () => {
  const item = newComplaintVariance("code-766", "name-881");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
