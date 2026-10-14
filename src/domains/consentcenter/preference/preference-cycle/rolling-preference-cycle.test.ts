import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPreferenceCycle } from "./rolling-preference-cycle.js";

test("RollingPreferenceCycle starts in proposed", () => {
  const item = newRollingPreferenceCycle("code-935", "name-553");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPreferenceCycle moves to withdrawn", () => {
  const item = newRollingPreferenceCycle("code-935", "name-553");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RollingPreferenceCycle rejects moves from withdrawn", () => {
  const item = newRollingPreferenceCycle("code-935", "name-553");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
