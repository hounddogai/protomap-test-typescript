import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

test("LenientCsatCheckpoint starts in draft", () => {
  const item = newLenientCsatCheckpoint("code-411", "label-792");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCsatCheckpoint moves to active", () => {
  const item = newLenientCsatCheckpoint("code-411", "label-792");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LenientCsatCheckpoint rejects moves from closed", () => {
  const item = newLenientCsatCheckpoint("code-411", "label-792");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
