import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingProfile } from "./pacing-profile.js";

test("PacingProfile starts in planned", () => {
  const item = newPacingProfile("code-197", "title-648");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingProfile moves to in progress", () => {
  const item = newPacingProfile("code-197", "title-648");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PacingProfile rejects moves from cancelled", () => {
  const item = newPacingProfile("code-197", "title-648");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
