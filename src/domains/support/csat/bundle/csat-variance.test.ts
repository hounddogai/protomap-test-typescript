import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatVariance } from "./csat-variance.js";

test("CsatVariance starts in proposed", () => {
  const item = newCsatVariance("code-649", "label-789");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatVariance moves to rejected", () => {
  const item = newCsatVariance("code-649", "label-789");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CsatVariance rejects moves from withdrawn", () => {
  const item = newCsatVariance("code-649", "label-789");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
