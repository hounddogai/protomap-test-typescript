import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalTierSlot } from "./regional-tier-slot.js";

test("RegionalTierSlot starts in created", () => {
  const item = newRegionalTierSlot("code-207", "name-499");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalTierSlot moves to validated", () => {
  const item = newRegionalTierSlot("code-207", "name-499");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalTierSlot rejects moves from retired", () => {
  const item = newRegionalTierSlot("code-207", "name-499");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
