import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingProofSchedule } from "./rolling-proof-schedule.js";

test("RollingProofSchedule starts in new", () => {
  const item = newRollingProofSchedule("code-457", "name-256");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingProofSchedule moves to queued", () => {
  const item = newRollingProofSchedule("code-457", "name-256");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingProofSchedule rejects moves from failed", () => {
  const item = newRollingProofSchedule("code-457", "name-256");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
