import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

test("CappedDoubleOptInBundle starts in open", () => {
  const item = newCappedDoubleOptInBundle("code-956", "title-894");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDoubleOptInBundle moves to in review", () => {
  const item = newCappedDoubleOptInBundle("code-956", "title-894");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CappedDoubleOptInBundle rejects moves from archived", () => {
  const item = newCappedDoubleOptInBundle("code-956", "title-894");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
