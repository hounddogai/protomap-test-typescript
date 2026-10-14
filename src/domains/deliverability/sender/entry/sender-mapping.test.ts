import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderMapping } from "./sender-mapping.js";

test("SenderMapping starts in requested", () => {
  const item = newSenderMapping("code-49", "title-939");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderMapping moves to revoked", () => {
  const item = newSenderMapping("code-49", "title-939");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("SenderMapping rejects moves from expired", () => {
  const item = newSenderMapping("code-49", "title-939");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
