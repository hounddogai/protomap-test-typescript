import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFrequencyDraft } from "./capped-frequency-draft.js";

test("CappedFrequencyDraft starts in proposed", () => {
  const item = newCappedFrequencyDraft("code-419", "title-116");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFrequencyDraft moves to approved", () => {
  const item = newCappedFrequencyDraft("code-419", "title-116");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedFrequencyDraft rejects moves from withdrawn", () => {
  const item = newCappedFrequencyDraft("code-419", "title-116");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
