import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTierRecord } from "./capped-tier-record.js";

test("CappedTierRecord starts in planned", () => {
  const item = newCappedTierRecord("code-949", "label-565");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTierRecord moves to in progress", () => {
  const item = newCappedTierRecord("code-949", "label-565");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CappedTierRecord rejects moves from cancelled", () => {
  const item = newCappedTierRecord("code-949", "label-565");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
