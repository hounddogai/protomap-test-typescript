import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightLedger } from "./insight-ledger.js";

test("InsightLedger starts in open", () => {
  const item = newInsightLedger("code-961", "title-167");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightLedger moves to resolved", () => {
  const item = newInsightLedger("code-961", "title-167");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("InsightLedger rejects moves from archived", () => {
  const item = newInsightLedger("code-961", "title-167");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
