import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInAssignment } from "./double-opt-in-assignment.js";

test("DoubleOptInAssignment starts in created", () => {
  const item = newDoubleOptInAssignment("code-925", "name-693");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInAssignment moves to validated", () => {
  const item = newDoubleOptInAssignment("code-925", "name-693");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DoubleOptInAssignment rejects moves from retired", () => {
  const item = newDoubleOptInAssignment("code-925", "name-693");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
