import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWindowPreference } from "./tiered-window-preference.js";

test("TieredWindowPreference starts in planned", () => {
  const item = newTieredWindowPreference("code-55", "label-758");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWindowPreference moves to completed", () => {
  const item = newTieredWindowPreference("code-55", "label-758");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TieredWindowPreference rejects moves from cancelled", () => {
  const item = newTieredWindowPreference("code-55", "label-758");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
