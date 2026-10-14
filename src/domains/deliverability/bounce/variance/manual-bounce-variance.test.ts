import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBounceVariance } from "./manual-bounce-variance.js";

test("ManualBounceVariance starts in draft", () => {
  const item = newManualBounceVariance("code-275", "label-650");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBounceVariance moves to pending", () => {
  const item = newManualBounceVariance("code-275", "label-650");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ManualBounceVariance rejects moves from closed", () => {
  const item = newManualBounceVariance("code-275", "label-650");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
