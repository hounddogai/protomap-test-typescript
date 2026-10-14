import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationOverride } from "./activation-override.js";

test("ActivationOverride starts in open", () => {
  const item = newActivationOverride("code-200", "name-424");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationOverride moves to resolved", () => {
  const item = newActivationOverride("code-200", "name-424");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ActivationOverride rejects moves from archived", () => {
  const item = newActivationOverride("code-200", "name-424");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
