import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelScore } from "./model-score.js";

test("ModelScore starts in proposed", () => {
  const item = newModelScore("code-300", "label-528");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelScore moves to withdrawn", () => {
  const item = newModelScore("code-300", "label-528");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ModelScore rejects moves from withdrawn", () => {
  const item = newModelScore("code-300", "label-528");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
