import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientActivationOverride } from "./lenient-activation-override.js";

test("LenientActivationOverride starts in idle", () => {
  const item = newLenientActivationOverride("code-389", "name-483");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientActivationOverride moves to draining", () => {
  const item = newLenientActivationOverride("code-389", "name-483");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LenientActivationOverride rejects moves from stopped", () => {
  const item = newLenientActivationOverride("code-389", "name-483");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
