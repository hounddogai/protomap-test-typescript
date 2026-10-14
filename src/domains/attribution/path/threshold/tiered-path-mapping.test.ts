import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPathMapping } from "./tiered-path-mapping.js";

test("TieredPathMapping starts in requested", () => {
  const item = newTieredPathMapping("code-233", "label-933");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPathMapping moves to revoked", () => {
  const item = newTieredPathMapping("code-233", "label-933");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TieredPathMapping rejects moves from expired", () => {
  const item = newTieredPathMapping("code-233", "label-933");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
