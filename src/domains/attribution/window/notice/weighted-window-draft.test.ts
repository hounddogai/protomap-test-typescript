import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWindowDraft } from "./weighted-window-draft.js";

test("WeightedWindowDraft starts in open", () => {
  const item = newWeightedWindowDraft("code-561", "label-719");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWindowDraft moves to reopened", () => {
  const item = newWeightedWindowDraft("code-561", "label-719");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("WeightedWindowDraft rejects moves from archived", () => {
  const item = newWeightedWindowDraft("code-561", "label-719");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
