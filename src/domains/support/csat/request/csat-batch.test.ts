import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatBatch } from "./csat-batch.js";

test("CsatBatch starts in requested", () => {
  const item = newCsatBatch("code-119", "name-778");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatBatch moves to granted", () => {
  const item = newCsatBatch("code-119", "name-778");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CsatBatch rejects moves from expired", () => {
  const item = newCsatBatch("code-119", "name-778");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
