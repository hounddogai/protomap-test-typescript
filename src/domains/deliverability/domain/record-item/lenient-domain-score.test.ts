import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDomainScore } from "./lenient-domain-score.js";

test("LenientDomainScore starts in draft", () => {
  const item = newLenientDomainScore("code-208", "label-987");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDomainScore moves to pending", () => {
  const item = newLenientDomainScore("code-208", "label-987");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientDomainScore rejects moves from closed", () => {
  const item = newLenientDomainScore("code-208", "label-987");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
