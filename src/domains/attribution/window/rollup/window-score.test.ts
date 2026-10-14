import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowScore } from "./window-score.js";

test("WindowScore starts in planned", () => {
  const item = newWindowScore("code-209", "label-955");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowScore moves to scheduled", () => {
  const item = newWindowScore("code-209", "label-955");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WindowScore rejects moves from cancelled", () => {
  const item = newWindowScore("code-209", "label-955");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
