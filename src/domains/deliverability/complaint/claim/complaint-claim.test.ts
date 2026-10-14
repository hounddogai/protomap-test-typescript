import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintClaim } from "./complaint-claim.js";

test("ComplaintClaim starts in created", () => {
  const item = newComplaintClaim("code-370", "title-379");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintClaim moves to validated", () => {
  const item = newComplaintClaim("code-370", "title-379");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ComplaintClaim rejects moves from retired", () => {
  const item = newComplaintClaim("code-370", "title-379");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
