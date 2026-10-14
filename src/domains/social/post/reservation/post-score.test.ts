import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostScore } from "./post-score.js";

test("PostScore starts in draft", () => {
  const item = newPostScore("code-939", "title-968");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostScore moves to suspended", () => {
  const item = newPostScore("code-939", "title-968");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PostScore rejects moves from closed", () => {
  const item = newPostScore("code-939", "title-968");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
