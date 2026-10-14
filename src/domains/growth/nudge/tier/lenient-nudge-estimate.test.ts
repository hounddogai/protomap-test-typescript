import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientNudgeEstimate } from "./lenient-nudge-estimate.js";

test("LenientNudgeEstimate starts in new", () => {
  const item = newLenientNudgeEstimate("code-607", "name-389");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientNudgeEstimate moves to queued", () => {
  const item = newLenientNudgeEstimate("code-607", "name-389");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientNudgeEstimate rejects moves from failed", () => {
  const item = newLenientNudgeEstimate("code-607", "name-389");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
