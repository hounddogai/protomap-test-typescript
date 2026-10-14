import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencySlot } from "./frequency-slot.js";

test("FrequencySlot starts in open", () => {
  const item = newFrequencySlot("code-820", "label-403");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencySlot moves to resolved", () => {
  const item = newFrequencySlot("code-820", "label-403");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FrequencySlot rejects moves from archived", () => {
  const item = newFrequencySlot("code-820", "label-403");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
