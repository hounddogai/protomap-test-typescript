import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

test("SeasonalPaywallSchedule starts in new", () => {
  const item = newSeasonalPaywallSchedule("code-700", "label-497");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPaywallSchedule moves to queued", () => {
  const item = newSeasonalPaywallSchedule("code-700", "label-497");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalPaywallSchedule rejects moves from failed", () => {
  const item = newSeasonalPaywallSchedule("code-700", "label-497");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
