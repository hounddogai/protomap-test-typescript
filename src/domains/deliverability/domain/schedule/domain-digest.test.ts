import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainDigest } from "./domain-digest.js";

test("DomainDigest starts in requested", () => {
  const item = newDomainDigest("code-725", "name-154");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainDigest moves to revoked", () => {
  const item = newDomainDigest("code-725", "name-154");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DomainDigest rejects moves from expired", () => {
  const item = newDomainDigest("code-725", "name-154");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
