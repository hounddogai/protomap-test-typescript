import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalMacroDigest } from "./global-macro-digest.js";

test("GlobalMacroDigest starts in open", () => {
  const item = newGlobalMacroDigest("code-375", "name-785");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalMacroDigest moves to reopened", () => {
  const item = newGlobalMacroDigest("code-375", "name-785");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("GlobalMacroDigest rejects moves from archived", () => {
  const item = newGlobalMacroDigest("code-375", "name-785");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
