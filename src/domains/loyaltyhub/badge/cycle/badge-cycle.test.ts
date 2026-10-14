import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeCycle } from "./badge-cycle.js";

test("BadgeCycle starts in new", () => {
  const item = newBadgeCycle("code-162", "label-40");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeCycle moves to running", () => {
  const item = newBadgeCycle("code-162", "label-40");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BadgeCycle rejects moves from failed", () => {
  const item = newBadgeCycle("code-162", "label-40");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
