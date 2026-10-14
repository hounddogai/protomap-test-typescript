import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEscalationDigest } from "./seasonal-escalation-digest.js";

test("SeasonalEscalationDigest starts in draft", () => {
  const item = newSeasonalEscalationDigest("code-710", "name-46");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEscalationDigest moves to closed", () => {
  const item = newSeasonalEscalationDigest("code-710", "name-46");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("SeasonalEscalationDigest rejects moves from closed", () => {
  const item = newSeasonalEscalationDigest("code-710", "name-46");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
