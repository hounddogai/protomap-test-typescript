import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalInsightBatch } from "./seasonal-insight-batch.js";

test("SeasonalInsightBatch starts in draft", () => {
  const item = newSeasonalInsightBatch("code-313", "name-180");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalInsightBatch moves to closed", () => {
  const item = newSeasonalInsightBatch("code-313", "name-180");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("SeasonalInsightBatch rejects moves from closed", () => {
  const item = newSeasonalInsightBatch("code-313", "name-180");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
