import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceDraft } from "./bounce-draft.js";

test("BounceDraft starts in open", () => {
  const item = newBounceDraft("code-809", "title-338");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceDraft moves to in review", () => {
  const item = newBounceDraft("code-809", "title-338");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BounceDraft rejects moves from archived", () => {
  const item = newBounceDraft("code-809", "title-338");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
