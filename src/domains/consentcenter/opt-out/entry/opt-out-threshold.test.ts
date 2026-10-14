import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutThreshold } from "./opt-out-threshold.js";

test("OptOutThreshold starts in requested", () => {
  const item = newOptOutThreshold("code-65", "name-730");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutThreshold moves to revoked", () => {
  const item = newOptOutThreshold("code-65", "name-730");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("OptOutThreshold rejects moves from expired", () => {
  const item = newOptOutThreshold("code-65", "name-730");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
