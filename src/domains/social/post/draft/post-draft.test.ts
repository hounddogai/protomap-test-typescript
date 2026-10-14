import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostDraft } from "./post-draft.js";

test("PostDraft starts in draft", () => {
  const item = newPostDraft("code-655", "name-115");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostDraft moves to active", () => {
  const item = newPostDraft("code-655", "name-115");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PostDraft rejects moves from closed", () => {
  const item = newPostDraft("code-655", "name-115");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
