import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightNotice } from "./insight-notice.js";

test("InsightNotice starts in planned", () => {
  const item = newInsightNotice("code-319", "title-660");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightNotice moves to cancelled", () => {
  const item = newInsightNotice("code-319", "title-660");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("InsightNotice rejects moves from cancelled", () => {
  const item = newInsightNotice("code-319", "title-660");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
