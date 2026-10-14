import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementException } from "./placement-exception.js";

test("PlacementException starts in draft", () => {
  const item = newPlacementException("code-562", "label-663");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementException moves to suspended", () => {
  const item = newPlacementException("code-562", "label-663");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PlacementException rejects moves from closed", () => {
  const item = newPlacementException("code-562", "label-663");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
