import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitDraft } from "./wait-draft.js";

test("WaitDraft starts in open", () => {
  const item = newWaitDraft("code-827", "title-916");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitDraft moves to resolved", () => {
  const item = newWaitDraft("code-827", "title-916");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WaitDraft rejects moves from archived", () => {
  const item = newWaitDraft("code-827", "title-916");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
