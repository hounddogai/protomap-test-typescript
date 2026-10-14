import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaVariance } from "./sla-variance.js";

test("SlaVariance starts in open", () => {
  const item = newSlaVariance("code-757", "title-652");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaVariance moves to reopened", () => {
  const item = newSlaVariance("code-757", "title-652");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SlaVariance rejects moves from archived", () => {
  const item = newSlaVariance("code-757", "title-652");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
