import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyMetric } from "./reply-metric.js";

test("ReplyMetric starts in created", () => {
  const item = newReplyMetric("code-848", "label-321");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyMetric moves to validated", () => {
  const item = newReplyMetric("code-848", "label-321");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ReplyMetric rejects moves from retired", () => {
  const item = newReplyMetric("code-848", "label-321");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
