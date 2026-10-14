import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

test("FallbackMacroSnapshot starts in planned", () => {
  const item = newFallbackMacroSnapshot("code-276", "name-545");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackMacroSnapshot moves to in progress", () => {
  const item = newFallbackMacroSnapshot("code-276", "name-545");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackMacroSnapshot rejects moves from cancelled", () => {
  const item = newFallbackMacroSnapshot("code-276", "name-545");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
