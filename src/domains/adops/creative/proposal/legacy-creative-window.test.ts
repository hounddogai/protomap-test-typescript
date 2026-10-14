import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCreativeWindow } from "./legacy-creative-window.js";

test("LegacyCreativeWindow starts in created", () => {
  const item = newLegacyCreativeWindow("code-143", "name-329");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCreativeWindow moves to retired", () => {
  const item = newLegacyCreativeWindow("code-143", "name-329");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LegacyCreativeWindow rejects moves from retired", () => {
  const item = newLegacyCreativeWindow("code-143", "name-329");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
