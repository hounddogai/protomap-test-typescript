import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalTouchpointSegment } from "./seasonal-touchpoint-segment.js";

test("SeasonalTouchpointSegment starts in requested", () => {
  const item = newSeasonalTouchpointSegment("code-186", "label-668");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalTouchpointSegment moves to expired", () => {
  const item = newSeasonalTouchpointSegment("code-186", "label-668");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SeasonalTouchpointSegment rejects moves from expired", () => {
  const item = newSeasonalTouchpointSegment("code-186", "label-668");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
