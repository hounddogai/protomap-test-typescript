import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDomainMetric } from "./scheduled-domain-metric.js";

test("ScheduledDomainMetric starts in open", () => {
  const item = newScheduledDomainMetric("code-116", "label-298");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDomainMetric moves to in review", () => {
  const item = newScheduledDomainMetric("code-116", "label-298");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledDomainMetric rejects moves from archived", () => {
  const item = newScheduledDomainMetric("code-116", "label-298");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
