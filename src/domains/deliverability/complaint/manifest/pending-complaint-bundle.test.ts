import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingComplaintBundle } from "./pending-complaint-bundle.js";

test("PendingComplaintBundle starts in proposed", () => {
  const item = newPendingComplaintBundle("code-555", "name-467");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingComplaintBundle moves to rejected", () => {
  const item = newPendingComplaintBundle("code-555", "name-467");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PendingComplaintBundle rejects moves from withdrawn", () => {
  const item = newPendingComplaintBundle("code-555", "name-467");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
