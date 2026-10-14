import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

test("SeasonalSuppressionBundle starts in open", () => {
  const item = newSeasonalSuppressionBundle("code-946", "label-48");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSuppressionBundle moves to archived", () => {
  const item = newSeasonalSuppressionBundle("code-946", "label-48");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SeasonalSuppressionBundle rejects moves from archived", () => {
  const item = newSeasonalSuppressionBundle("code-946", "label-48");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
