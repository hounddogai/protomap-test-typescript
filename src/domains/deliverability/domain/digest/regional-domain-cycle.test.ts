import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalDomainCycle } from "./regional-domain-cycle.js";

test("RegionalDomainCycle starts in idle", () => {
  const item = newRegionalDomainCycle("code-32", "name-112");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalDomainCycle moves to stopped", () => {
  const item = newRegionalDomainCycle("code-32", "name-112");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("RegionalDomainCycle rejects moves from stopped", () => {
  const item = newRegionalDomainCycle("code-32", "name-112");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
