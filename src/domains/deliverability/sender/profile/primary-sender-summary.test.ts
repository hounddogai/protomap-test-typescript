import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySenderSummary } from "./primary-sender-summary.js";

test("PrimarySenderSummary starts in planned", () => {
  const item = newPrimarySenderSummary("code-616", "title-692");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySenderSummary moves to completed", () => {
  const item = newPrimarySenderSummary("code-616", "title-692");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PrimarySenderSummary rejects moves from cancelled", () => {
  const item = newPrimarySenderSummary("code-616", "title-692");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
