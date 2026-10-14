import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

test("PrimaryMacroSnapshot starts in created", () => {
  const item = newPrimaryMacroSnapshot("code-847", "name-230");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryMacroSnapshot moves to retired", () => {
  const item = newPrimaryMacroSnapshot("code-847", "name-230");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PrimaryMacroSnapshot rejects moves from retired", () => {
  const item = newPrimaryMacroSnapshot("code-847", "name-230");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
