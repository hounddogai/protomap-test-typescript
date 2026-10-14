import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackWindowClaim } from "./fallback-window-claim.js";

test("FallbackWindowClaim starts in created", () => {
  const item = newFallbackWindowClaim("code-25", "label-385");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackWindowClaim moves to validated", () => {
  const item = newFallbackWindowClaim("code-25", "label-385");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackWindowClaim rejects moves from retired", () => {
  const item = newFallbackWindowClaim("code-25", "label-385");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
