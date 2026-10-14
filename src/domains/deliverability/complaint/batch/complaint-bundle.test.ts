import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintBundle } from "./complaint-bundle.js";

test("ComplaintBundle starts in proposed", () => {
  const item = newComplaintBundle("code-634", "name-166");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintBundle moves to approved", () => {
  const item = newComplaintBundle("code-634", "name-166");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ComplaintBundle rejects moves from withdrawn", () => {
  const item = newComplaintBundle("code-634", "name-166");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
