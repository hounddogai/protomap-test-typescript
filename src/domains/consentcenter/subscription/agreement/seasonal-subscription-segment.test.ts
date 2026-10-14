import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

test("SeasonalSubscriptionSegment starts in requested", () => {
  const item = newSeasonalSubscriptionSegment("code-376", "name-860");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSubscriptionSegment moves to granted", () => {
  const item = newSeasonalSubscriptionSegment("code-376", "name-860");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalSubscriptionSegment rejects moves from expired", () => {
  const item = newSeasonalSubscriptionSegment("code-376", "name-860");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
