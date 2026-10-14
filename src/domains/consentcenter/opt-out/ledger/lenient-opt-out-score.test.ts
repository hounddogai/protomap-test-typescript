import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientOptOutScore } from "./lenient-opt-out-score.js";

test("LenientOptOutScore starts in new", () => {
  const item = newLenientOptOutScore("code-757", "label-814");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientOptOutScore moves to queued", () => {
  const item = newLenientOptOutScore("code-757", "label-814");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientOptOutScore rejects moves from failed", () => {
  const item = newLenientOptOutScore("code-757", "label-814");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
