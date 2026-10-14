import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedInsightDraft } from "./weighted-insight-draft.js";

test("WeightedInsightDraft starts in draft", () => {
  const item = newWeightedInsightDraft("code-344", "label-938");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedInsightDraft moves to suspended", () => {
  const item = newWeightedInsightDraft("code-344", "label-938");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("WeightedInsightDraft rejects moves from closed", () => {
  const item = newWeightedInsightDraft("code-344", "label-938");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
