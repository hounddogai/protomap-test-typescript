import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeBatch } from "./badge-batch.js";

test("BadgeBatch starts in created", () => {
  const item = newBadgeBatch("code-906", "name-468");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeBatch moves to validated", () => {
  const item = newBadgeBatch("code-906", "name-468");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BadgeBatch rejects moves from retired", () => {
  const item = newBadgeBatch("code-906", "name-468");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
