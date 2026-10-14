import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeDraft } from "./badge-draft.js";

test("BadgeDraft starts in open", () => {
  const item = newBadgeDraft("code-652", "title-78");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeDraft moves to in review", () => {
  const item = newBadgeDraft("code-652", "title-78");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BadgeDraft rejects moves from archived", () => {
  const item = newBadgeDraft("code-652", "title-78");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
