import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBounceRollup } from "./fallback-bounce-rollup.js";

test("FallbackBounceRollup starts in requested", () => {
  const item = newFallbackBounceRollup("code-281", "name-998");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBounceRollup moves to revoked", () => {
  const item = newFallbackBounceRollup("code-281", "name-998");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("FallbackBounceRollup rejects moves from expired", () => {
  const item = newFallbackBounceRollup("code-281", "name-998");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
