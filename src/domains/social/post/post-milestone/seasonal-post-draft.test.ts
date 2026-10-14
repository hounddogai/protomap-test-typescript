import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPostDraft } from "./seasonal-post-draft.js";

test("SeasonalPostDraft starts in proposed", () => {
  const item = newSeasonalPostDraft("code-696", "title-402");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPostDraft moves to approved", () => {
  const item = newSeasonalPostDraft("code-696", "title-402");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SeasonalPostDraft rejects moves from withdrawn", () => {
  const item = newSeasonalPostDraft("code-696", "title-402");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
