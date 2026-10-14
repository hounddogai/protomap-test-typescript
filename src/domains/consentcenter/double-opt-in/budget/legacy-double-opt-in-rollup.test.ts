import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

test("LegacyDoubleOptInRollup starts in created", () => {
  const item = newLegacyDoubleOptInRollup("code-120", "name-664");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDoubleOptInRollup moves to published", () => {
  const item = newLegacyDoubleOptInRollup("code-120", "name-664");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyDoubleOptInRollup rejects moves from retired", () => {
  const item = newLegacyDoubleOptInRollup("code-120", "name-664");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
