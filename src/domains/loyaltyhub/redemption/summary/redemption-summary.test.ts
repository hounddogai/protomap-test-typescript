import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionSummary } from "./redemption-summary.js";

test("RedemptionSummary starts in draft", () => {
  const item = newRedemptionSummary("code-679", "title-946");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionSummary moves to active", () => {
  const item = newRedemptionSummary("code-679", "title-946");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RedemptionSummary rejects moves from closed", () => {
  const item = newRedemptionSummary("code-679", "title-946");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
