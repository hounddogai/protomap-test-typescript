import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyJourneyMapping } from "./legacy-journey-mapping.js";

test("LegacyJourneyMapping starts in planned", () => {
  const item = newLegacyJourneyMapping("code-786", "label-534");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyJourneyMapping moves to scheduled", () => {
  const item = newLegacyJourneyMapping("code-786", "label-534");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LegacyJourneyMapping rejects moves from cancelled", () => {
  const item = newLegacyJourneyMapping("code-786", "label-534");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
