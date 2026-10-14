import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDomainTemplate } from "./lenient-domain-template.js";

test("LenientDomainTemplate starts in requested", () => {
  const item = newLenientDomainTemplate("code-801", "label-171");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDomainTemplate moves to revoked", () => {
  const item = newLenientDomainTemplate("code-801", "label-171");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LenientDomainTemplate rejects moves from expired", () => {
  const item = newLenientDomainTemplate("code-801", "label-171");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
