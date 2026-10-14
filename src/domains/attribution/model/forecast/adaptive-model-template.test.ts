import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveModelTemplate } from "./adaptive-model-template.js";

test("AdaptiveModelTemplate starts in planned", () => {
  const item = newAdaptiveModelTemplate("code-811", "label-967");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveModelTemplate moves to in progress", () => {
  const item = newAdaptiveModelTemplate("code-811", "label-967");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptiveModelTemplate rejects moves from cancelled", () => {
  const item = newAdaptiveModelTemplate("code-811", "label-967");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
