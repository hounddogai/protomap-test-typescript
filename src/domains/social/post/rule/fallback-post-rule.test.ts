import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPostRule } from "./fallback-post-rule.js";

test("FallbackPostRule starts in created", () => {
  const item = newFallbackPostRule("code-318", "label-415");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPostRule moves to validated", () => {
  const item = newFallbackPostRule("code-318", "label-415");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackPostRule rejects moves from retired", () => {
  const item = newFallbackPostRule("code-318", "label-415");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
