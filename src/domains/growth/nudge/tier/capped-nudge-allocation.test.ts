import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedNudgeAllocation } from "./capped-nudge-allocation.js";

test("CappedNudgeAllocation starts in new", () => {
  const item = newCappedNudgeAllocation("code-989", "label-168");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedNudgeAllocation moves to done", () => {
  const item = newCappedNudgeAllocation("code-989", "label-168");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("CappedNudgeAllocation rejects moves from failed", () => {
  const item = newCappedNudgeAllocation("code-989", "label-168");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
