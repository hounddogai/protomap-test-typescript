import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCreditOverride } from "./default-credit-override.js";

test("DefaultCreditOverride starts in idle", () => {
  const item = newDefaultCreditOverride("code-244", "title-602");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCreditOverride moves to ready", () => {
  const item = newDefaultCreditOverride("code-244", "title-602");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("DefaultCreditOverride rejects moves from stopped", () => {
  const item = newDefaultCreditOverride("code-244", "title-602");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
