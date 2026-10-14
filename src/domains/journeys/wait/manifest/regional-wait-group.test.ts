import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalWaitGroup } from "./regional-wait-group.js";

test("RegionalWaitGroup starts in idle", () => {
  const item = newRegionalWaitGroup("code-619", "name-714");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalWaitGroup moves to warming", () => {
  const item = newRegionalWaitGroup("code-619", "name-714");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalWaitGroup rejects moves from stopped", () => {
  const item = newRegionalWaitGroup("code-619", "name-714");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
