import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathMetric } from "./path-metric.js";

test("PathMetric starts in requested", () => {
  const item = newPathMetric("code-340", "name-513");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathMetric moves to expired", () => {
  const item = newPathMetric("code-340", "name-513");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PathMetric rejects moves from expired", () => {
  const item = newPathMetric("code-340", "name-513");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
