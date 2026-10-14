import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSuppressionProfile } from "./regional-suppression-profile.js";

test("RegionalSuppressionProfile starts in planned", () => {
  const item = newRegionalSuppressionProfile("code-998", "label-784");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSuppressionProfile moves to in progress", () => {
  const item = newRegionalSuppressionProfile("code-998", "label-784");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RegionalSuppressionProfile rejects moves from cancelled", () => {
  const item = newRegionalSuppressionProfile("code-998", "label-784");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
