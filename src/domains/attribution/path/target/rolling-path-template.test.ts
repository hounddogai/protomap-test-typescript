import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPathTemplate } from "./rolling-path-template.js";

test("RollingPathTemplate starts in planned", () => {
  const item = newRollingPathTemplate("code-729", "name-297");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPathTemplate moves to in progress", () => {
  const item = newRollingPathTemplate("code-729", "name-297");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingPathTemplate rejects moves from cancelled", () => {
  const item = newRollingPathTemplate("code-729", "name-297");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
