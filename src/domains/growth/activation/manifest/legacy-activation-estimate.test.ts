import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyActivationEstimate } from "./legacy-activation-estimate.js";

test("LegacyActivationEstimate starts in draft", () => {
  const item = newLegacyActivationEstimate("code-445", "label-348");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyActivationEstimate moves to pending", () => {
  const item = newLegacyActivationEstimate("code-445", "label-348");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LegacyActivationEstimate rejects moves from closed", () => {
  const item = newLegacyActivationEstimate("code-445", "label-348");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
