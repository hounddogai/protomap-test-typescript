import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackMacroOverride } from "./fallback-macro-override.js";

test("FallbackMacroOverride starts in requested", () => {
  const item = newFallbackMacroOverride("code-995", "title-834");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackMacroOverride moves to granted", () => {
  const item = newFallbackMacroOverride("code-995", "title-834");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FallbackMacroOverride rejects moves from expired", () => {
  const item = newFallbackMacroOverride("code-995", "title-834");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
