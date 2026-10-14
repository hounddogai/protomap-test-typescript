import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgeTarget } from "./rolling-nudge-target.js";

test("RollingNudgeTarget starts in open", () => {
  const item = newRollingNudgeTarget("code-330", "title-390");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgeTarget moves to reopened", () => {
  const item = newRollingNudgeTarget("code-330", "title-390");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RollingNudgeTarget rejects moves from archived", () => {
  const item = newRollingNudgeTarget("code-330", "title-390");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
