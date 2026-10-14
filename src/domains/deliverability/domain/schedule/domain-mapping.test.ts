import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainMapping } from "./domain-mapping.js";

test("DomainMapping starts in requested", () => {
  const item = newDomainMapping("code-162", "label-25");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainMapping moves to granted", () => {
  const item = newDomainMapping("code-162", "label-25");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DomainMapping rejects moves from expired", () => {
  const item = newDomainMapping("code-162", "label-25");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
