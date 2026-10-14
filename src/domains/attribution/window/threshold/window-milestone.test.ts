import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowMilestone } from "./window-milestone.js";

test("WindowMilestone starts in new", () => {
  const item = newWindowMilestone("code-620", "label-96");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowMilestone moves to queued", () => {
  const item = newWindowMilestone("code-620", "label-96");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WindowMilestone rejects moves from failed", () => {
  const item = newWindowMilestone("code-620", "label-96");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
