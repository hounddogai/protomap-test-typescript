import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneyPolicy } from "./rolling-journey-policy.js";

test("RollingJourneyPolicy starts in proposed", () => {
  const item = newRollingJourneyPolicy("code-501", "label-366");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneyPolicy moves to rejected", () => {
  const item = newRollingJourneyPolicy("code-501", "label-366");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingJourneyPolicy rejects moves from withdrawn", () => {
  const item = newRollingJourneyPolicy("code-501", "label-366");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
