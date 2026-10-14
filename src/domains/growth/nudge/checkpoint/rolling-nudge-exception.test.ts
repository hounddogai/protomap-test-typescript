import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgeException } from "./rolling-nudge-exception.js";

test("RollingNudgeException starts in created", () => {
  const item = newRollingNudgeException("code-985", "title-823");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgeException moves to validated", () => {
  const item = newRollingNudgeException("code-985", "title-823");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingNudgeException rejects moves from retired", () => {
  const item = newRollingNudgeException("code-985", "title-823");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
