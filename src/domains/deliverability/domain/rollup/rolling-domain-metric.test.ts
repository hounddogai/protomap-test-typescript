import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingDomainMetric } from "./rolling-domain-metric.js";

test("RollingDomainMetric starts in new", () => {
  const item = newRollingDomainMetric("code-97", "name-356");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingDomainMetric moves to queued", () => {
  const item = newRollingDomainMetric("code-97", "name-356");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingDomainMetric rejects moves from failed", () => {
  const item = newRollingDomainMetric("code-97", "name-356");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
