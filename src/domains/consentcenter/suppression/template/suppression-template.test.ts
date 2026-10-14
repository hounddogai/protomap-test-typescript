import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionTemplate } from "./suppression-template.js";

test("SuppressionTemplate starts in created", () => {
  const item = newSuppressionTemplate("code-164", "name-246");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionTemplate moves to validated", () => {
  const item = newSuppressionTemplate("code-164", "name-246");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SuppressionTemplate rejects moves from retired", () => {
  const item = newSuppressionTemplate("code-164", "name-246");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
