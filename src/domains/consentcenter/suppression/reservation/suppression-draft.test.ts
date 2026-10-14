import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionDraft } from "./suppression-draft.js";

test("SuppressionDraft starts in requested", () => {
  const item = newSuppressionDraft("code-221", "title-188");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionDraft moves to expired", () => {
  const item = newSuppressionDraft("code-221", "title-188");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SuppressionDraft rejects moves from expired", () => {
  const item = newSuppressionDraft("code-221", "title-188");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
