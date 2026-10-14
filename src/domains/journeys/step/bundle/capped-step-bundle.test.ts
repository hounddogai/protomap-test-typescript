import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStepBundle } from "./capped-step-bundle.js";

test("CappedStepBundle starts in draft", () => {
  const item = newCappedStepBundle("code-244", "title-492");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStepBundle moves to suspended", () => {
  const item = newCappedStepBundle("code-244", "title-492");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("CappedStepBundle rejects moves from closed", () => {
  const item = newCappedStepBundle("code-244", "title-492");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
