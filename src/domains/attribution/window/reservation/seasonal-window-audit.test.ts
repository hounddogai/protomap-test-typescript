import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWindowAudit } from "./seasonal-window-audit.js";

test("SeasonalWindowAudit starts in planned", () => {
  const item = newSeasonalWindowAudit("code-444", "name-276");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWindowAudit moves to scheduled", () => {
  const item = newSeasonalWindowAudit("code-444", "name-276");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SeasonalWindowAudit rejects moves from cancelled", () => {
  const item = newSeasonalWindowAudit("code-444", "name-276");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
