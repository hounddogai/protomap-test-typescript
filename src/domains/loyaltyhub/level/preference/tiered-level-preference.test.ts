import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLevelPreference } from "./tiered-level-preference.js";

test("TieredLevelPreference starts in new", () => {
  const item = newTieredLevelPreference("code-172", "label-39");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLevelPreference moves to queued", () => {
  const item = newTieredLevelPreference("code-172", "label-39");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredLevelPreference rejects moves from failed", () => {
  const item = newTieredLevelPreference("code-172", "label-39");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
