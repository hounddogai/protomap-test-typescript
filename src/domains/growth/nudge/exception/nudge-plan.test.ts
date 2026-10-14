import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgePlan } from "./nudge-plan.js";

test("NudgePlan starts in draft", () => {
  const item = newNudgePlan("code-966", "label-396");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgePlan moves to suspended", () => {
  const item = newNudgePlan("code-966", "label-396");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("NudgePlan rejects moves from closed", () => {
  const item = newNudgePlan("code-966", "label-396");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
