import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightBatch } from "./insight-batch.js";

test("InsightBatch starts in open", () => {
  const item = newInsightBatch("code-185", "name-871");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightBatch moves to reopened", () => {
  const item = newInsightBatch("code-185", "name-871");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("InsightBatch rejects moves from archived", () => {
  const item = newInsightBatch("code-185", "name-871");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
