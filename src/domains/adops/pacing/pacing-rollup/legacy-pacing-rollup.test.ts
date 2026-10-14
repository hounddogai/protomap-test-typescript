import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPacingRollup } from "./legacy-pacing-rollup.js";

test("LegacyPacingRollup starts in created", () => {
  const item = newLegacyPacingRollup("code-326", "label-531");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPacingRollup moves to published", () => {
  const item = newLegacyPacingRollup("code-326", "label-531");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyPacingRollup rejects moves from retired", () => {
  const item = newLegacyPacingRollup("code-326", "label-531");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
