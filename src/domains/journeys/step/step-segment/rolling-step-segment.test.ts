import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingStepSegment } from "./rolling-step-segment.js";

test("RollingStepSegment starts in requested", () => {
  const item = newRollingStepSegment("code-599", "title-229");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingStepSegment moves to granted", () => {
  const item = newRollingStepSegment("code-599", "title-229");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingStepSegment rejects moves from expired", () => {
  const item = newRollingStepSegment("code-599", "title-229");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
