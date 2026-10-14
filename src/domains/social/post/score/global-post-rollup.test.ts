import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPostRollup } from "./global-post-rollup.js";

test("GlobalPostRollup starts in requested", () => {
  const item = newGlobalPostRollup("code-408", "label-661");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPostRollup moves to revoked", () => {
  const item = newGlobalPostRollup("code-408", "label-661");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("GlobalPostRollup rejects moves from expired", () => {
  const item = newGlobalPostRollup("code-408", "label-661");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
