import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFrequencyAgreement } from "./lenient-frequency-agreement.js";

test("LenientFrequencyAgreement starts in proposed", () => {
  const item = newLenientFrequencyAgreement("code-86", "name-587");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFrequencyAgreement moves to approved", () => {
  const item = newLenientFrequencyAgreement("code-86", "name-587");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientFrequencyAgreement rejects moves from withdrawn", () => {
  const item = newLenientFrequencyAgreement("code-86", "name-587");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
