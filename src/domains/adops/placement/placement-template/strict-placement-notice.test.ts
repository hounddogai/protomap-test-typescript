import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPlacementNotice } from "./strict-placement-notice.js";

test("StrictPlacementNotice starts in draft", () => {
  const item = newStrictPlacementNotice("code-238", "label-656");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPlacementNotice moves to pending", () => {
  const item = newStrictPlacementNotice("code-238", "label-656");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictPlacementNotice rejects moves from closed", () => {
  const item = newStrictPlacementNotice("code-238", "label-656");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
