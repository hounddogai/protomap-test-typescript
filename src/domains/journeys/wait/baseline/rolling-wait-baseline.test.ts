import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWaitBaseline } from "./rolling-wait-baseline.js";

test("RollingWaitBaseline starts in created", () => {
  const item = newRollingWaitBaseline("code-24", "name-369");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWaitBaseline moves to validated", () => {
  const item = newRollingWaitBaseline("code-24", "name-369");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingWaitBaseline rejects moves from retired", () => {
  const item = newRollingWaitBaseline("code-24", "name-369");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
