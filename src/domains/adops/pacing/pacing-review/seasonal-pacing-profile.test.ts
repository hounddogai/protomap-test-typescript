import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPacingProfile } from "./seasonal-pacing-profile.js";

test("SeasonalPacingProfile starts in idle", () => {
  const item = newSeasonalPacingProfile("code-457", "title-701");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPacingProfile moves to ready", () => {
  const item = newSeasonalPacingProfile("code-457", "title-701");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalPacingProfile rejects moves from stopped", () => {
  const item = newSeasonalPacingProfile("code-457", "title-701");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
