import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalQueueBaseline } from "./seasonal-queue-baseline.js";

test("SeasonalQueueBaseline starts in created", () => {
  const item = newSeasonalQueueBaseline("code-4", "label-573");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalQueueBaseline moves to published", () => {
  const item = newSeasonalQueueBaseline("code-4", "label-573");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SeasonalQueueBaseline rejects moves from retired", () => {
  const item = newSeasonalQueueBaseline("code-4", "label-573");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
