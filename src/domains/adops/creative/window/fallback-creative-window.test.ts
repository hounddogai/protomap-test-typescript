import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCreativeWindow } from "./fallback-creative-window.js";

test("FallbackCreativeWindow starts in requested", () => {
  const item = newFallbackCreativeWindow("code-561", "label-880");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCreativeWindow moves to revoked", () => {
  const item = newFallbackCreativeWindow("code-561", "label-880");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("FallbackCreativeWindow rejects moves from expired", () => {
  const item = newFallbackCreativeWindow("code-561", "label-880");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
