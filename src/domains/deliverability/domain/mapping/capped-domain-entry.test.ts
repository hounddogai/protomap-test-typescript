import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDomainEntry } from "./capped-domain-entry.js";

test("CappedDomainEntry starts in planned", () => {
  const item = newCappedDomainEntry("code-856", "name-165");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDomainEntry moves to in progress", () => {
  const item = newCappedDomainEntry("code-856", "name-165");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CappedDomainEntry rejects moves from cancelled", () => {
  const item = newCappedDomainEntry("code-856", "name-165");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
