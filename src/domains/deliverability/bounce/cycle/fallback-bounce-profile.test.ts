import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBounceProfile } from "./fallback-bounce-profile.js";

test("FallbackBounceProfile starts in open", () => {
  const item = newFallbackBounceProfile("code-856", "name-225");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBounceProfile moves to in review", () => {
  const item = newFallbackBounceProfile("code-856", "name-225");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackBounceProfile rejects moves from archived", () => {
  const item = newFallbackBounceProfile("code-856", "name-225");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
