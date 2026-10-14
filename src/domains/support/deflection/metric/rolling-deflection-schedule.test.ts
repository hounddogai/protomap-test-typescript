import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingDeflectionSchedule } from "./rolling-deflection-schedule.js";

test("RollingDeflectionSchedule starts in created", () => {
  const item = newRollingDeflectionSchedule("code-770", "label-781");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingDeflectionSchedule moves to validated", () => {
  const item = newRollingDeflectionSchedule("code-770", "label-781");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingDeflectionSchedule rejects moves from retired", () => {
  const item = newRollingDeflectionSchedule("code-770", "label-781");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
