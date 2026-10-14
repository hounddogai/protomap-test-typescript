import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

test("WeightedDomainSnapshot starts in planned", () => {
  const item = newWeightedDomainSnapshot("code-165", "title-934");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDomainSnapshot moves to in progress", () => {
  const item = newWeightedDomainSnapshot("code-165", "title-934");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("WeightedDomainSnapshot rejects moves from cancelled", () => {
  const item = newWeightedDomainSnapshot("code-165", "title-934");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
