import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSuppressionBundle } from "./regional-suppression-bundle.js";

test("RegionalSuppressionBundle starts in created", () => {
  const item = newRegionalSuppressionBundle("code-820", "title-789");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSuppressionBundle moves to validated", () => {
  const item = newRegionalSuppressionBundle("code-820", "title-789");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalSuppressionBundle rejects moves from retired", () => {
  const item = newRegionalSuppressionBundle("code-820", "title-789");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
