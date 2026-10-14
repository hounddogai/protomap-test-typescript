import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutEntry } from "./opt-out-entry.js";

test("OptOutEntry starts in open", () => {
  const item = newOptOutEntry("code-329", "name-515");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutEntry moves to reopened", () => {
  const item = newOptOutEntry("code-329", "name-515");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("OptOutEntry rejects moves from archived", () => {
  const item = newOptOutEntry("code-329", "name-515");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
