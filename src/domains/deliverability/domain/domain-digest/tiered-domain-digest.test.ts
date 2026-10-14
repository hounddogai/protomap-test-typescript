import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDomainDigest } from "./tiered-domain-digest.js";

test("TieredDomainDigest starts in requested", () => {
  const item = newTieredDomainDigest("code-223", "label-614");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDomainDigest moves to granted", () => {
  const item = newTieredDomainDigest("code-223", "label-614");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredDomainDigest rejects moves from expired", () => {
  const item = newTieredDomainDigest("code-223", "label-614");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
