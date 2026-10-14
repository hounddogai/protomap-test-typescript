import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightDraft } from "./insight-draft.js";

test("InsightDraft starts in proposed", () => {
  const item = newInsightDraft("code-544", "label-503");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightDraft moves to approved", () => {
  const item = newInsightDraft("code-544", "label-503");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("InsightDraft rejects moves from withdrawn", () => {
  const item = newInsightDraft("code-544", "label-503");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
