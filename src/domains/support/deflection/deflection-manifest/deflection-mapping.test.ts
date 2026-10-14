import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionMapping } from "./deflection-mapping.js";

test("DeflectionMapping starts in open", () => {
  const item = newDeflectionMapping("code-434", "title-90");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionMapping moves to resolved", () => {
  const item = newDeflectionMapping("code-434", "title-90");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DeflectionMapping rejects moves from archived", () => {
  const item = newDeflectionMapping("code-434", "title-90");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
