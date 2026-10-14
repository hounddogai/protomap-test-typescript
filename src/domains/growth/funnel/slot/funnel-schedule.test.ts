import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelSchedule } from "./funnel-schedule.js";

test("FunnelSchedule starts in created", () => {
  const item = newFunnelSchedule("code-519", "title-846");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelSchedule moves to retired", () => {
  const item = newFunnelSchedule("code-519", "title-846");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("FunnelSchedule rejects moves from retired", () => {
  const item = newFunnelSchedule("code-519", "title-846");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
