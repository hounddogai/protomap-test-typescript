import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalOptOutBundle } from "./regional-opt-out-bundle.js";

test("RegionalOptOutBundle starts in requested", () => {
  const item = newRegionalOptOutBundle("code-172", "name-186");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalOptOutBundle moves to revoked", () => {
  const item = newRegionalOptOutBundle("code-172", "name-186");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RegionalOptOutBundle rejects moves from expired", () => {
  const item = newRegionalOptOutBundle("code-172", "name-186");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
