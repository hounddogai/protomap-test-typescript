import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainWindow } from "./domain-window.js";

test("DomainWindow starts in requested", () => {
  const item = newDomainWindow("code-563", "label-72");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainWindow moves to revoked", () => {
  const item = newDomainWindow("code-563", "label-72");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DomainWindow rejects moves from expired", () => {
  const item = newDomainWindow("code-563", "label-72");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
