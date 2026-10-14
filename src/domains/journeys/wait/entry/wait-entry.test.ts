import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitEntry } from "./wait-entry.js";

test("WaitEntry starts in open", () => {
  const item = newWaitEntry("code-273", "title-889");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitEntry moves to in review", () => {
  const item = newWaitEntry("code-273", "title-889");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WaitEntry rejects moves from archived", () => {
  const item = newWaitEntry("code-273", "title-889");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
