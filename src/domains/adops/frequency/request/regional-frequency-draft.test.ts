import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalFrequencyDraft } from "./regional-frequency-draft.js";

test("RegionalFrequencyDraft starts in created", () => {
  const item = newRegionalFrequencyDraft("code-735", "name-916");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalFrequencyDraft moves to published", () => {
  const item = newRegionalFrequencyDraft("code-735", "name-916");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RegionalFrequencyDraft rejects moves from retired", () => {
  const item = newRegionalFrequencyDraft("code-735", "name-916");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
