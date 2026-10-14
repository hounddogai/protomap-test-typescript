import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroManifest } from "./macro-manifest.js";

test("MacroManifest starts in new", () => {
  const item = newMacroManifest("code-923", "label-767");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroManifest moves to failed", () => {
  const item = newMacroManifest("code-923", "label-767");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("MacroManifest rejects moves from failed", () => {
  const item = newMacroManifest("code-923", "label-767");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
