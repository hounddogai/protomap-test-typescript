import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatSummary } from "./csat-summary.js";

test("CsatSummary starts in new", () => {
  const item = newCsatSummary("code-14", "label-628");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatSummary moves to queued", () => {
  const item = newCsatSummary("code-14", "label-628");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CsatSummary rejects moves from failed", () => {
  const item = newCsatSummary("code-14", "label-628");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
