import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDomainException } from "./weighted-domain-exception.js";

test("WeightedDomainException starts in draft", () => {
  const item = newWeightedDomainException("code-138", "title-913");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDomainException moves to suspended", () => {
  const item = newWeightedDomainException("code-138", "title-913");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("WeightedDomainException rejects moves from closed", () => {
  const item = newWeightedDomainException("code-138", "title-913");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
