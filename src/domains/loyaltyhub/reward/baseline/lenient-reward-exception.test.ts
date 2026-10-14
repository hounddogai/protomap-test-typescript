import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRewardException } from "./lenient-reward-exception.js";

test("LenientRewardException starts in created", () => {
  const item = newLenientRewardException("code-682", "label-646");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRewardException moves to published", () => {
  const item = newLenientRewardException("code-682", "label-646");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientRewardException rejects moves from retired", () => {
  const item = newLenientRewardException("code-682", "label-646");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
