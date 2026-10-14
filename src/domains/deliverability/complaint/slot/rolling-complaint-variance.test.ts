import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingComplaintVariance } from "./rolling-complaint-variance.js";

test("RollingComplaintVariance starts in open", () => {
  const item = newRollingComplaintVariance("code-347", "name-372");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingComplaintVariance moves to in review", () => {
  const item = newRollingComplaintVariance("code-347", "name-372");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingComplaintVariance rejects moves from archived", () => {
  const item = newRollingComplaintVariance("code-347", "name-372");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
