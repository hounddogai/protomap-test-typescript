import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackDeflectionDigest } from "./fallback-deflection-digest.js";

test("FallbackDeflectionDigest starts in open", () => {
  const item = newFallbackDeflectionDigest("code-584", "name-473");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackDeflectionDigest moves to in review", () => {
  const item = newFallbackDeflectionDigest("code-584", "name-473");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackDeflectionDigest rejects moves from archived", () => {
  const item = newFallbackDeflectionDigest("code-584", "name-473");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
