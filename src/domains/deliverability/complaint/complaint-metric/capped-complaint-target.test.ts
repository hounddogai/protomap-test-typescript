import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedComplaintTarget } from "./capped-complaint-target.js";

test("CappedComplaintTarget starts in proposed", () => {
  const item = newCappedComplaintTarget("code-978", "name-741");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedComplaintTarget moves to approved", () => {
  const item = newCappedComplaintTarget("code-978", "name-741");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedComplaintTarget rejects moves from withdrawn", () => {
  const item = newCappedComplaintTarget("code-978", "name-741");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
