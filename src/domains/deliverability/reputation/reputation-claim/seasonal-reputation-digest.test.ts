import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalReputationDigest } from "./seasonal-reputation-digest.js";

test("SeasonalReputationDigest starts in planned", () => {
  const item = newSeasonalReputationDigest("code-492", "title-389");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalReputationDigest moves to completed", () => {
  const item = newSeasonalReputationDigest("code-492", "title-389");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SeasonalReputationDigest rejects moves from cancelled", () => {
  const item = newSeasonalReputationDigest("code-492", "title-389");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
