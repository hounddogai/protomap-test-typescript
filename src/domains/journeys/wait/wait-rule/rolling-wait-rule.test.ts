import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWaitRule } from "./rolling-wait-rule.js";

test("RollingWaitRule starts in planned", () => {
  const item = newRollingWaitRule("code-864", "title-473");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWaitRule moves to in progress", () => {
  const item = newRollingWaitRule("code-864", "title-473");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingWaitRule rejects moves from cancelled", () => {
  const item = newRollingWaitRule("code-864", "title-473");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
