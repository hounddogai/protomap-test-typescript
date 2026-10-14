import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCsatAudit } from "./seasonal-csat-audit.js";

test("SeasonalCsatAudit starts in draft", () => {
  const item = newSeasonalCsatAudit("code-598", "label-894");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCsatAudit moves to closed", () => {
  const item = newSeasonalCsatAudit("code-598", "label-894");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("SeasonalCsatAudit rejects moves from closed", () => {
  const item = newSeasonalCsatAudit("code-598", "label-894");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
