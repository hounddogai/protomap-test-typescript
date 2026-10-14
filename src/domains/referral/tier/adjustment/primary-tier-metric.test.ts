import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTierMetric } from "./primary-tier-metric.js";

test("PrimaryTierMetric starts in requested", () => {
  const item = newPrimaryTierMetric("code-361", "name-973");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTierMetric moves to granted", () => {
  const item = newPrimaryTierMetric("code-361", "name-973");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryTierMetric rejects moves from expired", () => {
  const item = newPrimaryTierMetric("code-361", "name-973");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
