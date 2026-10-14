import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyNudgeMetric } from "./legacy-nudge-metric.js";

test("LegacyNudgeMetric starts in open", () => {
  const item = newLegacyNudgeMetric("code-724", "title-41");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyNudgeMetric moves to resolved", () => {
  const item = newLegacyNudgeMetric("code-724", "title-41");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LegacyNudgeMetric rejects moves from archived", () => {
  const item = newLegacyNudgeMetric("code-724", "title-41");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
