import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBounceBaseline } from "./fallback-bounce-baseline.js";

test("FallbackBounceBaseline starts in open", () => {
  const item = newFallbackBounceBaseline("code-587", "title-826");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBounceBaseline moves to in review", () => {
  const item = newFallbackBounceBaseline("code-587", "title-826");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackBounceBaseline rejects moves from archived", () => {
  const item = newFallbackBounceBaseline("code-587", "title-826");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
