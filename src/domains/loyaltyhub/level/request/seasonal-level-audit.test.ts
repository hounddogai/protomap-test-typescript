import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLevelAudit } from "./seasonal-level-audit.js";

test("SeasonalLevelAudit starts in created", () => {
  const item = newSeasonalLevelAudit("code-504", "name-618");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLevelAudit moves to published", () => {
  const item = newSeasonalLevelAudit("code-504", "name-618");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SeasonalLevelAudit rejects moves from retired", () => {
  const item = newSeasonalLevelAudit("code-504", "name-618");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
