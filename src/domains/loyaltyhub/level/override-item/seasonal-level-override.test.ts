import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLevelOverride } from "./seasonal-level-override.js";

test("SeasonalLevelOverride starts in requested", () => {
  const item = newSeasonalLevelOverride("code-187", "title-622");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLevelOverride moves to granted", () => {
  const item = newSeasonalLevelOverride("code-187", "title-622");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalLevelOverride rejects moves from expired", () => {
  const item = newSeasonalLevelOverride("code-187", "title-622");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
