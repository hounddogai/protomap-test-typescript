import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaBatch } from "./sla-batch.js";

test("SlaBatch starts in requested", () => {
  const item = newSlaBatch("code-197", "title-269");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaBatch moves to granted", () => {
  const item = newSlaBatch("code-197", "title-269");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SlaBatch rejects moves from expired", () => {
  const item = newSlaBatch("code-197", "title-269");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
