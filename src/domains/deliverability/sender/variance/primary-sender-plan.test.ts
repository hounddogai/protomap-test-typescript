import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySenderPlan } from "./primary-sender-plan.js";

test("PrimarySenderPlan starts in new", () => {
  const item = newPrimarySenderPlan("code-920", "label-110");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySenderPlan moves to queued", () => {
  const item = newPrimarySenderPlan("code-920", "label-110");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PrimarySenderPlan rejects moves from failed", () => {
  const item = newPrimarySenderPlan("code-920", "label-110");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
