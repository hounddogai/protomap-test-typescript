import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointReview } from "./touchpoint-review.js";

test("TouchpointReview starts in idle", () => {
  const item = newTouchpointReview("code-669", "title-941");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointReview moves to warming", () => {
  const item = newTouchpointReview("code-669", "title-941");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TouchpointReview rejects moves from stopped", () => {
  const item = newTouchpointReview("code-669", "title-941");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
