import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWaitException } from "./legacy-wait-exception.js";

test("LegacyWaitException starts in idle", () => {
  const item = newLegacyWaitException("code-782", "name-923");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWaitException moves to draining", () => {
  const item = newLegacyWaitException("code-782", "name-923");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LegacyWaitException rejects moves from stopped", () => {
  const item = newLegacyWaitException("code-782", "name-923");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
