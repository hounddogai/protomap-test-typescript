import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualDomainScore } from "./manual-domain-score.js";

test("ManualDomainScore starts in requested", () => {
  const item = newManualDomainScore("code-723", "title-748");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualDomainScore moves to revoked", () => {
  const item = newManualDomainScore("code-723", "title-748");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualDomainScore rejects moves from expired", () => {
  const item = newManualDomainScore("code-723", "title-748");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
