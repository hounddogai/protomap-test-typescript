import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

test("ScheduledFrequencyNotice starts in created", () => {
  const item = newScheduledFrequencyNotice("code-600", "label-600");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFrequencyNotice moves to validated", () => {
  const item = newScheduledFrequencyNotice("code-600", "label-600");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledFrequencyNotice rejects moves from retired", () => {
  const item = newScheduledFrequencyNotice("code-600", "label-600");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
