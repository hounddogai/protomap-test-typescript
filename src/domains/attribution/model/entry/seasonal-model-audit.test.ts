import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalModelAudit } from "./seasonal-model-audit.js";

test("SeasonalModelAudit starts in planned", () => {
  const item = newSeasonalModelAudit("code-815", "label-662");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalModelAudit moves to cancelled", () => {
  const item = newSeasonalModelAudit("code-815", "label-662");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("SeasonalModelAudit rejects moves from cancelled", () => {
  const item = newSeasonalModelAudit("code-815", "label-662");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
