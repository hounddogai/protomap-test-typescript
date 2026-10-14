import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDomainSchedule } from "./adaptive-domain-schedule.js";

test("AdaptiveDomainSchedule starts in planned", () => {
  const item = newAdaptiveDomainSchedule("code-39", "label-664");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDomainSchedule moves to scheduled", () => {
  const item = newAdaptiveDomainSchedule("code-39", "label-664");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveDomainSchedule rejects moves from cancelled", () => {
  const item = newAdaptiveDomainSchedule("code-39", "label-664");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
