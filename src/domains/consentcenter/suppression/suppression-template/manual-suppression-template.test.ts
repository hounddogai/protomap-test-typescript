import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSuppressionTemplate } from "./manual-suppression-template.js";

test("ManualSuppressionTemplate starts in draft", () => {
  const item = newManualSuppressionTemplate("code-210", "label-179");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSuppressionTemplate moves to active", () => {
  const item = newManualSuppressionTemplate("code-210", "label-179");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ManualSuppressionTemplate rejects moves from closed", () => {
  const item = newManualSuppressionTemplate("code-210", "label-179");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
