import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionRecord } from "./redemption-record.js";

test("RedemptionRecord starts in created", () => {
  const item = newRedemptionRecord("code-967", "label-464");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionRecord moves to published", () => {
  const item = newRedemptionRecord("code-967", "label-464");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RedemptionRecord rejects moves from retired", () => {
  const item = newRedemptionRecord("code-967", "label-464");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
