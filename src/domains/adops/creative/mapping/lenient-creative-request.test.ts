import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCreativeRequest } from "./lenient-creative-request.js";

test("LenientCreativeRequest starts in requested", () => {
  const item = newLenientCreativeRequest("code-884", "label-460");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCreativeRequest moves to revoked", () => {
  const item = newLenientCreativeRequest("code-884", "label-460");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LenientCreativeRequest rejects moves from expired", () => {
  const item = newLenientCreativeRequest("code-884", "label-460");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
