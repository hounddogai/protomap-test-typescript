import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFlightEntry } from "./default-flight-entry.js";

test("DefaultFlightEntry starts in open", () => {
  const item = newDefaultFlightEntry("code-776", "title-900");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFlightEntry moves to archived", () => {
  const item = newDefaultFlightEntry("code-776", "title-900");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("DefaultFlightEntry rejects moves from archived", () => {
  const item = newDefaultFlightEntry("code-776", "title-900");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
