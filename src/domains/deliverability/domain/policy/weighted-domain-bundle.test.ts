import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDomainBundle } from "./weighted-domain-bundle.js";

test("WeightedDomainBundle starts in open", () => {
  const item = newWeightedDomainBundle("code-673", "title-704");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDomainBundle moves to in review", () => {
  const item = newWeightedDomainBundle("code-673", "title-704");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedDomainBundle rejects moves from archived", () => {
  const item = newWeightedDomainBundle("code-673", "title-704");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
