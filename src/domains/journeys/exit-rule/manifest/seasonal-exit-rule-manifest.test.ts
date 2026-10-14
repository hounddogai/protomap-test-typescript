import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

test("SeasonalExitRuleManifest starts in open", () => {
  const item = newSeasonalExitRuleManifest("code-129", "title-381");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalExitRuleManifest moves to in review", () => {
  const item = newSeasonalExitRuleManifest("code-129", "title-381");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalExitRuleManifest rejects moves from archived", () => {
  const item = newSeasonalExitRuleManifest("code-129", "title-381");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
