import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDomainDigest } from "./adaptive-domain-digest.js";

test("AdaptiveDomainDigest starts in planned", () => {
  const item = newAdaptiveDomainDigest("code-489", "name-100");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDomainDigest moves to completed", () => {
  const item = newAdaptiveDomainDigest("code-489", "name-100");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("AdaptiveDomainDigest rejects moves from cancelled", () => {
  const item = newAdaptiveDomainDigest("code-489", "name-100");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
