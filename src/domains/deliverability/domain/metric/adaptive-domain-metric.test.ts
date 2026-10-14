import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDomainMetric } from "./adaptive-domain-metric.js";

test("AdaptiveDomainMetric starts in created", () => {
  const item = newAdaptiveDomainMetric("code-144", "name-72");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDomainMetric moves to validated", () => {
  const item = newAdaptiveDomainMetric("code-144", "name-72");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptiveDomainMetric rejects moves from retired", () => {
  const item = newAdaptiveDomainMetric("code-144", "name-72");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
