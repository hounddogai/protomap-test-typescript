import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDeflectionRollup } from "./scheduled-deflection-rollup.js";

test("ScheduledDeflectionRollup starts in proposed", () => {
  const item = newScheduledDeflectionRollup("code-35", "name-432");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDeflectionRollup moves to withdrawn", () => {
  const item = newScheduledDeflectionRollup("code-35", "name-432");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ScheduledDeflectionRollup rejects moves from withdrawn", () => {
  const item = newScheduledDeflectionRollup("code-35", "name-432");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
