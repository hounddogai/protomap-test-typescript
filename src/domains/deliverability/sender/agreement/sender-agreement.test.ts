import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderAgreement } from "./sender-agreement.js";

test("SenderAgreement starts in requested", () => {
  const item = newSenderAgreement("code-379", "title-183");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderAgreement moves to revoked", () => {
  const item = newSenderAgreement("code-379", "title-183");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("SenderAgreement rejects moves from expired", () => {
  const item = newSenderAgreement("code-379", "title-183");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
