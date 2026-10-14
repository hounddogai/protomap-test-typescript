import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathDraft } from "./path-draft.js";

test("PathDraft starts in proposed", () => {
  const item = newPathDraft("code-700", "name-636");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathDraft moves to rejected", () => {
  const item = newPathDraft("code-700", "name-636");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PathDraft rejects moves from withdrawn", () => {
  const item = newPathDraft("code-700", "name-636");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
