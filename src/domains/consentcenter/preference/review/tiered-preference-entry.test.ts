import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPreferenceEntry } from "./tiered-preference-entry.js";

test("TieredPreferenceEntry starts in created", () => {
  const item = newTieredPreferenceEntry("code-808", "title-565");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPreferenceEntry moves to validated", () => {
  const item = newTieredPreferenceEntry("code-808", "title-565");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredPreferenceEntry rejects moves from retired", () => {
  const item = newTieredPreferenceEntry("code-808", "title-565");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
