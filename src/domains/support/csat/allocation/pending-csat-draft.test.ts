import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCsatDraft } from "./pending-csat-draft.js";

test("PendingCsatDraft starts in draft", () => {
  const item = newPendingCsatDraft("code-46", "name-557");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCsatDraft moves to active", () => {
  const item = newPendingCsatDraft("code-46", "name-557");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PendingCsatDraft rejects moves from closed", () => {
  const item = newPendingCsatDraft("code-46", "name-557");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
