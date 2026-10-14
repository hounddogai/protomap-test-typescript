import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBounceScore } from "./lenient-bounce-score.js";

test("LenientBounceScore starts in open", () => {
  const item = newLenientBounceScore("code-999", "title-268");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBounceScore moves to resolved", () => {
  const item = newLenientBounceScore("code-999", "title-268");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LenientBounceScore rejects moves from archived", () => {
  const item = newLenientBounceScore("code-999", "title-268");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
