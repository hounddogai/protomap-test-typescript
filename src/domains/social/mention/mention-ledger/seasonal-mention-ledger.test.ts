import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalMentionLedger } from "./seasonal-mention-ledger.js";

test("SeasonalMentionLedger starts in draft", () => {
  const item = newSeasonalMentionLedger("code-232", "label-112");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalMentionLedger moves to active", () => {
  const item = newSeasonalMentionLedger("code-232", "label-112");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("SeasonalMentionLedger rejects moves from closed", () => {
  const item = newSeasonalMentionLedger("code-232", "label-112");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
