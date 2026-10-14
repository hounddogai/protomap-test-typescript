import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalProofBundle } from "./seasonal-proof-bundle.js";

test("SeasonalProofBundle starts in draft", () => {
  const item = newSeasonalProofBundle("code-158", "label-461");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalProofBundle moves to suspended", () => {
  const item = newSeasonalProofBundle("code-158", "label-461");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SeasonalProofBundle rejects moves from closed", () => {
  const item = newSeasonalProofBundle("code-158", "label-461");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
