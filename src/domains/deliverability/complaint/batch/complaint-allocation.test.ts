import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintAllocation } from "./complaint-allocation.js";

test("ComplaintAllocation starts in requested", () => {
  const item = newComplaintAllocation("code-694", "name-188");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintAllocation moves to expired", () => {
  const item = newComplaintAllocation("code-694", "name-188");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ComplaintAllocation rejects moves from expired", () => {
  const item = newComplaintAllocation("code-694", "name-188");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
