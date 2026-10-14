import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPathDraft } from "./default-path-draft.js";

test("DefaultPathDraft starts in open", () => {
  const item = newDefaultPathDraft("code-908", "name-49");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPathDraft moves to resolved", () => {
  const item = newDefaultPathDraft("code-908", "name-49");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultPathDraft rejects moves from archived", () => {
  const item = newDefaultPathDraft("code-908", "name-49");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
