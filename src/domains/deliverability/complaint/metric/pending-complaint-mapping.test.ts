import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingComplaintMapping } from "./pending-complaint-mapping.js";

test("PendingComplaintMapping starts in created", () => {
  const item = newPendingComplaintMapping("code-629", "name-380");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingComplaintMapping moves to validated", () => {
  const item = newPendingComplaintMapping("code-629", "name-380");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingComplaintMapping rejects moves from retired", () => {
  const item = newPendingComplaintMapping("code-629", "name-380");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
