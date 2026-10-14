import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

test("AdaptiveDoubleOptInSlot starts in draft", () => {
  const item = newAdaptiveDoubleOptInSlot("code-288", "label-812");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDoubleOptInSlot moves to suspended", () => {
  const item = newAdaptiveDoubleOptInSlot("code-288", "label-812");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("AdaptiveDoubleOptInSlot rejects moves from closed", () => {
  const item = newAdaptiveDoubleOptInSlot("code-288", "label-812");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
