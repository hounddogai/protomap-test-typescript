import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictWaitCycle } from "./strict-wait-cycle.js";

test("StrictWaitCycle starts in new", () => {
  const item = newStrictWaitCycle("code-186", "label-528");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictWaitCycle moves to queued", () => {
  const item = newStrictWaitCycle("code-186", "label-528");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictWaitCycle rejects moves from failed", () => {
  const item = newStrictWaitCycle("code-186", "label-528");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
