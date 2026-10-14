import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeAllocation } from "./nudge-allocation.js";

test("NudgeAllocation starts in created", () => {
  const item = newNudgeAllocation("code-402", "name-866");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeAllocation moves to published", () => {
  const item = newNudgeAllocation("code-402", "name-866");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("NudgeAllocation rejects moves from retired", () => {
  const item = newNudgeAllocation("code-402", "name-866");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
