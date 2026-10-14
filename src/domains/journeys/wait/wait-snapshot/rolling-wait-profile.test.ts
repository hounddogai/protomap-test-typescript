import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWaitProfile } from "./rolling-wait-profile.js";

test("RollingWaitProfile starts in open", () => {
  const item = newRollingWaitProfile("code-47", "name-573");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWaitProfile moves to resolved", () => {
  const item = newRollingWaitProfile("code-47", "name-573");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingWaitProfile rejects moves from archived", () => {
  const item = newRollingWaitProfile("code-47", "name-573");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
