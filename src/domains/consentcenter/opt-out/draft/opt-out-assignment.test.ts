import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutAssignment } from "./opt-out-assignment.js";

test("OptOutAssignment starts in proposed", () => {
  const item = newOptOutAssignment("code-859", "label-631");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutAssignment moves to rejected", () => {
  const item = newOptOutAssignment("code-859", "label-631");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("OptOutAssignment rejects moves from withdrawn", () => {
  const item = newOptOutAssignment("code-859", "label-631");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
