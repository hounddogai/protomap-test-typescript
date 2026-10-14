import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDeflectionBundle } from "./lenient-deflection-bundle.js";

test("LenientDeflectionBundle starts in draft", () => {
  const item = newLenientDeflectionBundle("code-247", "name-574");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDeflectionBundle moves to suspended", () => {
  const item = newLenientDeflectionBundle("code-247", "name-574");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LenientDeflectionBundle rejects moves from closed", () => {
  const item = newLenientDeflectionBundle("code-247", "name-574");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
