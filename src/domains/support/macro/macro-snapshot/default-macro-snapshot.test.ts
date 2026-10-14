import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMacroSnapshot } from "./default-macro-snapshot.js";

test("DefaultMacroSnapshot starts in planned", () => {
  const item = newDefaultMacroSnapshot("code-152", "name-923");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMacroSnapshot moves to scheduled", () => {
  const item = newDefaultMacroSnapshot("code-152", "name-923");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultMacroSnapshot rejects moves from cancelled", () => {
  const item = newDefaultMacroSnapshot("code-152", "name-923");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
