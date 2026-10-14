import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBounceBatch } from "./primary-bounce-batch.js";

test("PrimaryBounceBatch starts in requested", () => {
  const item = newPrimaryBounceBatch("code-979", "title-970");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBounceBatch moves to granted", () => {
  const item = newPrimaryBounceBatch("code-979", "title-970");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryBounceBatch rejects moves from expired", () => {
  const item = newPrimaryBounceBatch("code-979", "title-970");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
