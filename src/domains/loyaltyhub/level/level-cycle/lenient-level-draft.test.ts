import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientLevelDraft } from "./lenient-level-draft.js";

test("LenientLevelDraft starts in new", () => {
  const item = newLenientLevelDraft("code-638", "title-819");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientLevelDraft moves to done", () => {
  const item = newLenientLevelDraft("code-638", "title-819");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LenientLevelDraft rejects moves from failed", () => {
  const item = newLenientLevelDraft("code-638", "title-819");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
