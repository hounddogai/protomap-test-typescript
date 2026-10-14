import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatEstimate } from "./csat-estimate.js";

test("CsatEstimate starts in open", () => {
  const item = newCsatEstimate("code-100", "label-995");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatEstimate moves to resolved", () => {
  const item = newCsatEstimate("code-100", "label-995");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CsatEstimate rejects moves from archived", () => {
  const item = newCsatEstimate("code-100", "label-995");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
