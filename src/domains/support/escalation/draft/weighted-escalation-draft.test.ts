import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEscalationDraft } from "./weighted-escalation-draft.js";

test("WeightedEscalationDraft starts in draft", () => {
  const item = newWeightedEscalationDraft("code-902", "title-789");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEscalationDraft moves to suspended", () => {
  const item = newWeightedEscalationDraft("code-902", "title-789");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("WeightedEscalationDraft rejects moves from closed", () => {
  const item = newWeightedEscalationDraft("code-902", "title-789");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
