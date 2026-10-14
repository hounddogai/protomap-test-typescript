import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPreferenceSnapshot } from "./tiered-preference-snapshot.js";

test("TieredPreferenceSnapshot starts in created", () => {
  const item = newTieredPreferenceSnapshot("code-140", "name-989");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPreferenceSnapshot moves to published", () => {
  const item = newTieredPreferenceSnapshot("code-140", "name-989");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredPreferenceSnapshot rejects moves from retired", () => {
  const item = newTieredPreferenceSnapshot("code-140", "name-989");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
