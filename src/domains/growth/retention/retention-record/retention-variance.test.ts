import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionVariance } from "./retention-variance.js";

test("RetentionVariance starts in requested", () => {
  const item = newRetentionVariance("code-79", "label-917");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionVariance moves to granted", () => {
  const item = newRetentionVariance("code-79", "label-917");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RetentionVariance rejects moves from expired", () => {
  const item = newRetentionVariance("code-79", "label-917");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
