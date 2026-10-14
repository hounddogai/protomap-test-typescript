import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

test("SeasonalDoubleOptInBatch starts in planned", () => {
  const item = newSeasonalDoubleOptInBatch("code-512", "label-128");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDoubleOptInBatch moves to scheduled", () => {
  const item = newSeasonalDoubleOptInBatch("code-512", "label-128");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SeasonalDoubleOptInBatch rejects moves from cancelled", () => {
  const item = newSeasonalDoubleOptInBatch("code-512", "label-128");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
