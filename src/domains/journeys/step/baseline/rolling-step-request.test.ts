import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingStepRequest } from "./rolling-step-request.js";

test("RollingStepRequest starts in draft", () => {
  const item = newRollingStepRequest("code-674", "name-132");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingStepRequest moves to pending", () => {
  const item = newRollingStepRequest("code-674", "name-132");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RollingStepRequest rejects moves from closed", () => {
  const item = newRollingStepRequest("code-674", "name-132");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
