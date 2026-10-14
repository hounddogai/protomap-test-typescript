import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFrequencyBaseline } from "./lenient-frequency-baseline.js";

test("LenientFrequencyBaseline starts in created", () => {
  const item = newLenientFrequencyBaseline("code-725", "title-751");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFrequencyBaseline moves to published", () => {
  const item = newLenientFrequencyBaseline("code-725", "title-751");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientFrequencyBaseline rejects moves from retired", () => {
  const item = newLenientFrequencyBaseline("code-725", "title-751");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
