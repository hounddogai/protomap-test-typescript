import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDomainMapping } from "./capped-domain-mapping.js";

test("CappedDomainMapping starts in requested", () => {
  const item = newCappedDomainMapping("code-553", "label-42");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDomainMapping moves to granted", () => {
  const item = newCappedDomainMapping("code-553", "label-42");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CappedDomainMapping rejects moves from expired", () => {
  const item = newCappedDomainMapping("code-553", "label-42");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
