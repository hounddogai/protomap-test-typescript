import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingComplaintTarget } from "./rolling-complaint-target.js";

test("RollingComplaintTarget starts in open", () => {
  const item = newRollingComplaintTarget("code-612", "name-251");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingComplaintTarget moves to resolved", () => {
  const item = newRollingComplaintTarget("code-612", "name-251");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingComplaintTarget rejects moves from archived", () => {
  const item = newRollingComplaintTarget("code-612", "name-251");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
