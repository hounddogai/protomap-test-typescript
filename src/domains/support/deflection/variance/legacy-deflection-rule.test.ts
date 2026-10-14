import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDeflectionRule } from "./legacy-deflection-rule.js";

test("LegacyDeflectionRule starts in new", () => {
  const item = newLegacyDeflectionRule("code-522", "title-864");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDeflectionRule moves to running", () => {
  const item = newLegacyDeflectionRule("code-522", "title-864");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyDeflectionRule rejects moves from failed", () => {
  const item = newLegacyDeflectionRule("code-522", "title-864");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
