import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitMetric } from "./wait-metric.js";

test("WaitMetric starts in requested", () => {
  const item = newWaitMetric("code-86", "name-114");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitMetric moves to granted", () => {
  const item = newWaitMetric("code-86", "name-114");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WaitMetric rejects moves from expired", () => {
  const item = newWaitMetric("code-86", "name-114");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
