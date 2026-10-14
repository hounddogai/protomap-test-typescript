import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionBatch } from "./suppression-batch.js";

test("SuppressionBatch starts in requested", () => {
  const item = newSuppressionBatch("code-967", "title-141");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionBatch moves to expired", () => {
  const item = newSuppressionBatch("code-967", "title-141");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SuppressionBatch rejects moves from expired", () => {
  const item = newSuppressionBatch("code-967", "title-141");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
