import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualInsightAdjustment } from "./manual-insight-adjustment.js";

test("ManualInsightAdjustment starts in open", () => {
  const item = newManualInsightAdjustment("code-685", "title-38");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualInsightAdjustment moves to reopened", () => {
  const item = newManualInsightAdjustment("code-685", "title-38");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ManualInsightAdjustment rejects moves from archived", () => {
  const item = newManualInsightAdjustment("code-685", "title-38");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
