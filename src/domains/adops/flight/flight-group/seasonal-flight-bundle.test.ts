import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalFlightBundle } from "./seasonal-flight-bundle.js";

test("SeasonalFlightBundle starts in open", () => {
  const item = newSeasonalFlightBundle("code-305", "name-698");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalFlightBundle moves to reopened", () => {
  const item = newSeasonalFlightBundle("code-305", "name-698");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SeasonalFlightBundle rejects moves from archived", () => {
  const item = newSeasonalFlightBundle("code-305", "name-698");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
