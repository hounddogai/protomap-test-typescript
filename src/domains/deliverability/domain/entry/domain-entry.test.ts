import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainEntry } from "./domain-entry.js";

test("DomainEntry starts in planned", () => {
  const item = newDomainEntry("code-247", "name-817");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainEntry moves to in progress", () => {
  const item = newDomainEntry("code-247", "name-817");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DomainEntry rejects moves from cancelled", () => {
  const item = newDomainEntry("code-247", "name-817");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
