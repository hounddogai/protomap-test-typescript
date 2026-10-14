import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFrequencyNotice } from "./tiered-frequency-notice.js";

test("TieredFrequencyNotice starts in open", () => {
  const item = newTieredFrequencyNotice("code-354", "title-191");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFrequencyNotice moves to reopened", () => {
  const item = newTieredFrequencyNotice("code-354", "title-191");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("TieredFrequencyNotice rejects moves from archived", () => {
  const item = newTieredFrequencyNotice("code-354", "title-191");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
