import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCreativeGroup } from "./legacy-creative-group.js";

test("LegacyCreativeGroup starts in created", () => {
  const item = newLegacyCreativeGroup("code-21", "name-555");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCreativeGroup moves to validated", () => {
  const item = newLegacyCreativeGroup("code-21", "name-555");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyCreativeGroup rejects moves from retired", () => {
  const item = newLegacyCreativeGroup("code-21", "name-555");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
