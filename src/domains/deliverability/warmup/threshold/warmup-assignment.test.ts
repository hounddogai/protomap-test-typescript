import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupAssignment } from "./warmup-assignment.js";

test("WarmupAssignment starts in open", () => {
  const item = newWarmupAssignment("code-990", "title-374");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupAssignment moves to resolved", () => {
  const item = newWarmupAssignment("code-990", "title-374");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WarmupAssignment rejects moves from archived", () => {
  const item = newWarmupAssignment("code-990", "title-374");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
