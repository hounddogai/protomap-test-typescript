import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightSchedule } from "./insight-schedule.js";

test("InsightSchedule starts in requested", () => {
  const item = newInsightSchedule("code-312", "label-698");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightSchedule moves to revoked", () => {
  const item = newInsightSchedule("code-312", "label-698");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("InsightSchedule rejects moves from expired", () => {
  const item = newInsightSchedule("code-312", "label-698");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
