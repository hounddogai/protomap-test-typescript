import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredModelVariance } from "./tiered-model-variance.js";

test("TieredModelVariance starts in requested", () => {
  const item = newTieredModelVariance("code-981", "title-208");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredModelVariance moves to revoked", () => {
  const item = newTieredModelVariance("code-981", "title-208");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TieredModelVariance rejects moves from expired", () => {
  const item = newTieredModelVariance("code-981", "title-208");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
