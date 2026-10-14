import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalFlightRecord } from "./seasonal-flight-record.js";

test("SeasonalFlightRecord starts in draft", () => {
  const item = newSeasonalFlightRecord("code-830", "name-456");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalFlightRecord moves to pending", () => {
  const item = newSeasonalFlightRecord("code-830", "name-456");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalFlightRecord rejects moves from closed", () => {
  const item = newSeasonalFlightRecord("code-830", "name-456");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
