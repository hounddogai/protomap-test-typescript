import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPathMetric } from "./global-path-metric.js";

test("GlobalPathMetric starts in draft", () => {
  const item = newGlobalPathMetric("code-410", "name-68");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPathMetric moves to pending", () => {
  const item = newGlobalPathMetric("code-410", "name-68");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("GlobalPathMetric rejects moves from closed", () => {
  const item = newGlobalPathMetric("code-410", "name-68");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
