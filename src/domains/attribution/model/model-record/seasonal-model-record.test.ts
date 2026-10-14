import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalModelRecord } from "./seasonal-model-record.js";

test("SeasonalModelRecord starts in proposed", () => {
  const item = newSeasonalModelRecord("code-653", "name-64");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalModelRecord moves to rejected", () => {
  const item = newSeasonalModelRecord("code-653", "name-64");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SeasonalModelRecord rejects moves from withdrawn", () => {
  const item = newSeasonalModelRecord("code-653", "name-64");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
