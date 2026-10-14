import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowDraft } from "./window-draft.js";

test("WindowDraft starts in created", () => {
  const item = newWindowDraft("code-621", "title-757");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowDraft moves to published", () => {
  const item = newWindowDraft("code-621", "title-757");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WindowDraft rejects moves from retired", () => {
  const item = newWindowDraft("code-621", "title-757");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
