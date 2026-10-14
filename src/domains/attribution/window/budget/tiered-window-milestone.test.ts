import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWindowMilestone } from "./tiered-window-milestone.js";

test("TieredWindowMilestone starts in open", () => {
  const item = newTieredWindowMilestone("code-356", "label-213");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWindowMilestone moves to in review", () => {
  const item = newTieredWindowMilestone("code-356", "label-213");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("TieredWindowMilestone rejects moves from archived", () => {
  const item = newTieredWindowMilestone("code-356", "label-213");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
