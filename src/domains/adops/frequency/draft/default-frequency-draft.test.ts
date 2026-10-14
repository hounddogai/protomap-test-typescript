import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFrequencyDraft } from "./default-frequency-draft.js";

test("DefaultFrequencyDraft starts in open", () => {
  const item = newDefaultFrequencyDraft("code-207", "label-734");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFrequencyDraft moves to resolved", () => {
  const item = newDefaultFrequencyDraft("code-207", "label-734");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultFrequencyDraft rejects moves from archived", () => {
  const item = newDefaultFrequencyDraft("code-207", "label-734");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
