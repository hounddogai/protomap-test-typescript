import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCreditNotice } from "./fallback-credit-notice.js";

test("FallbackCreditNotice starts in idle", () => {
  const item = newFallbackCreditNotice("code-959", "name-434");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCreditNotice moves to ready", () => {
  const item = newFallbackCreditNotice("code-959", "name-434");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackCreditNotice rejects moves from stopped", () => {
  const item = newFallbackCreditNotice("code-959", "name-434");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
