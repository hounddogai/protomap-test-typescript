import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingRequest } from "./pacing-request.js";

test("PacingRequest starts in created", () => {
  const item = newPacingRequest("code-803", "label-446");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingRequest moves to retired", () => {
  const item = newPacingRequest("code-803", "label-446");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PacingRequest rejects moves from retired", () => {
  const item = newPacingRequest("code-803", "label-446");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
