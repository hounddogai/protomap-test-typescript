import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRetentionMapping } from "./manual-retention-mapping.js";

test("ManualRetentionMapping starts in idle", () => {
  const item = newManualRetentionMapping("code-240", "title-906");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRetentionMapping moves to warming", () => {
  const item = newManualRetentionMapping("code-240", "title-906");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualRetentionMapping rejects moves from stopped", () => {
  const item = newManualRetentionMapping("code-240", "title-906");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
