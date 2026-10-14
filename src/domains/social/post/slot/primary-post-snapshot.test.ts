import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPostSnapshot } from "./primary-post-snapshot.js";

test("PrimaryPostSnapshot starts in requested", () => {
  const item = newPrimaryPostSnapshot("code-540", "label-507");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPostSnapshot moves to revoked", () => {
  const item = newPrimaryPostSnapshot("code-540", "label-507");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PrimaryPostSnapshot rejects moves from expired", () => {
  const item = newPrimaryPostSnapshot("code-540", "label-507");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
