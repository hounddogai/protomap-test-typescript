import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTierEntry } from "./legacy-tier-entry.js";

test("LegacyTierEntry starts in planned", () => {
  const item = newLegacyTierEntry("code-922", "title-513");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTierEntry moves to completed", () => {
  const item = newLegacyTierEntry("code-922", "title-513");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LegacyTierEntry rejects moves from cancelled", () => {
  const item = newLegacyTierEntry("code-922", "title-513");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
