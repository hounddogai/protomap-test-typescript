import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualActivationWindow } from "./manual-activation-window.js";

test("ManualActivationWindow starts in proposed", () => {
  const item = newManualActivationWindow("code-689", "name-677");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualActivationWindow moves to approved", () => {
  const item = newManualActivationWindow("code-689", "name-677");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ManualActivationWindow rejects moves from withdrawn", () => {
  const item = newManualActivationWindow("code-689", "name-677");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
