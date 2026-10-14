import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierRecord } from "./tier-record.js";

test("TierRecord starts in open", () => {
  const item = newTierRecord("code-985", "label-777");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierRecord moves to archived", () => {
  const item = newTierRecord("code-985", "label-777");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("TierRecord rejects moves from archived", () => {
  const item = newTierRecord("code-985", "label-777");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
