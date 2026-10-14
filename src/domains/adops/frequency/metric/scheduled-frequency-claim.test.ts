import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

test("ScheduledFrequencyClaim starts in planned", () => {
  const item = newScheduledFrequencyClaim("code-166", "label-406");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFrequencyClaim moves to cancelled", () => {
  const item = newScheduledFrequencyClaim("code-166", "label-406");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ScheduledFrequencyClaim rejects moves from cancelled", () => {
  const item = newScheduledFrequencyClaim("code-166", "label-406");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
