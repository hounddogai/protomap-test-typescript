import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderMetric } from "./sender-metric.js";

test("SenderMetric starts in draft", () => {
  const item = newSenderMetric("code-919", "title-864");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderMetric moves to closed", () => {
  const item = newSenderMetric("code-919", "title-864");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("SenderMetric rejects moves from closed", () => {
  const item = newSenderMetric("code-919", "title-864");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
