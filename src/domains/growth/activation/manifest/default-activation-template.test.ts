import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultActivationTemplate } from "./default-activation-template.js";

test("DefaultActivationTemplate starts in planned", () => {
  const item = newDefaultActivationTemplate("code-600", "title-496");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultActivationTemplate moves to scheduled", () => {
  const item = newDefaultActivationTemplate("code-600", "title-496");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultActivationTemplate rejects moves from cancelled", () => {
  const item = newDefaultActivationTemplate("code-600", "title-496");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
