import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationRule } from "./activation-rule.js";

test("ActivationRule starts in planned", () => {
  const item = newActivationRule("code-679", "title-800");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationRule moves to completed", () => {
  const item = newActivationRule("code-679", "title-800");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ActivationRule rejects moves from cancelled", () => {
  const item = newActivationRule("code-679", "title-800");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
