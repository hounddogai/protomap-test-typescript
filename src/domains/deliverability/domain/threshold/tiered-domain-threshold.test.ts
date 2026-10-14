import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDomainThreshold } from "./tiered-domain-threshold.js";

test("TieredDomainThreshold starts in idle", () => {
  const item = newTieredDomainThreshold("code-697", "name-471");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDomainThreshold moves to draining", () => {
  const item = newTieredDomainThreshold("code-697", "name-471");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredDomainThreshold rejects moves from stopped", () => {
  const item = newTieredDomainThreshold("code-697", "name-471");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
