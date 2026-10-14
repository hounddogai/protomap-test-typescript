import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintProfile } from "./complaint-profile.js";

test("ComplaintProfile starts in proposed", () => {
  const item = newComplaintProfile("code-438", "title-507");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintProfile moves to approved", () => {
  const item = newComplaintProfile("code-438", "title-507");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ComplaintProfile rejects moves from withdrawn", () => {
  const item = newComplaintProfile("code-438", "title-507");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
