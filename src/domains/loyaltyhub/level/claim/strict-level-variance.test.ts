import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictLevelVariance } from "./strict-level-variance.js";

test("StrictLevelVariance starts in created", () => {
  const item = newStrictLevelVariance("code-40", "label-16");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictLevelVariance moves to published", () => {
  const item = newStrictLevelVariance("code-40", "label-16");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StrictLevelVariance rejects moves from retired", () => {
  const item = newStrictLevelVariance("code-40", "label-16");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
