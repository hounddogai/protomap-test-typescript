import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainRecord } from "./domain-record.js";

test("DomainRecord starts in planned", () => {
  const item = newDomainRecord("code-849", "label-163");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainRecord moves to cancelled", () => {
  const item = newDomainRecord("code-849", "label-163");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("DomainRecord rejects moves from cancelled", () => {
  const item = newDomainRecord("code-849", "label-163");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
