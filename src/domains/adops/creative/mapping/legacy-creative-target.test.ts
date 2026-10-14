import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCreativeTarget } from "./legacy-creative-target.js";

test("LegacyCreativeTarget starts in created", () => {
  const item = newLegacyCreativeTarget("code-204", "title-584");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCreativeTarget moves to published", () => {
  const item = newLegacyCreativeTarget("code-204", "title-584");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyCreativeTarget rejects moves from retired", () => {
  const item = newLegacyCreativeTarget("code-204", "title-584");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
