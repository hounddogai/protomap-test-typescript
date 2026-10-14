import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPacingTarget } from "./default-pacing-target.js";

test("DefaultPacingTarget starts in planned", () => {
  const item = newDefaultPacingTarget("code-577", "label-948");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPacingTarget moves to in progress", () => {
  const item = newDefaultPacingTarget("code-577", "label-948");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DefaultPacingTarget rejects moves from cancelled", () => {
  const item = newDefaultPacingTarget("code-577", "label-948");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
