import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelDraft } from "./level-draft.js";

test("LevelDraft starts in proposed", () => {
  const item = newLevelDraft("code-429", "title-108");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelDraft moves to approved", () => {
  const item = newLevelDraft("code-429", "title-108");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LevelDraft rejects moves from withdrawn", () => {
  const item = newLevelDraft("code-429", "title-108");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
