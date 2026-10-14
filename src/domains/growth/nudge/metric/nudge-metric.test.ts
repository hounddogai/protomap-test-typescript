import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeMetric } from "./nudge-metric.js";

test("NudgeMetric starts in requested", () => {
  const item = newNudgeMetric("code-401", "label-931");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeMetric moves to granted", () => {
  const item = newNudgeMetric("code-401", "label-931");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("NudgeMetric rejects moves from expired", () => {
  const item = newNudgeMetric("code-401", "label-931");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
