import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionDraft } from "./deflection-draft.js";

test("DeflectionDraft starts in idle", () => {
  const item = newDeflectionDraft("code-723", "title-265");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionDraft moves to warming", () => {
  const item = newDeflectionDraft("code-723", "title-265");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("DeflectionDraft rejects moves from stopped", () => {
  const item = newDeflectionDraft("code-723", "title-265");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
