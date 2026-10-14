import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainVariance } from "./domain-variance.js";

test("DomainVariance starts in requested", () => {
  const item = newDomainVariance("code-138", "title-977");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainVariance moves to granted", () => {
  const item = newDomainVariance("code-138", "title-977");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DomainVariance rejects moves from expired", () => {
  const item = newDomainVariance("code-138", "title-977");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
