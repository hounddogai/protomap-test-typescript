import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEscalationRollup } from "./seasonal-escalation-rollup.js";

test("SeasonalEscalationRollup starts in proposed", () => {
  const item = newSeasonalEscalationRollup("code-34", "title-797");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEscalationRollup moves to withdrawn", () => {
  const item = newSeasonalEscalationRollup("code-34", "title-797");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SeasonalEscalationRollup rejects moves from withdrawn", () => {
  const item = newSeasonalEscalationRollup("code-34", "title-797");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
