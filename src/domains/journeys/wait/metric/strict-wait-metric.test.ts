import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictWaitMetric } from "./strict-wait-metric.js";

test("StrictWaitMetric starts in created", () => {
  const item = newStrictWaitMetric("code-795", "name-766");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictWaitMetric moves to validated", () => {
  const item = newStrictWaitMetric("code-795", "name-766");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictWaitMetric rejects moves from retired", () => {
  const item = newStrictWaitMetric("code-795", "name-766");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
