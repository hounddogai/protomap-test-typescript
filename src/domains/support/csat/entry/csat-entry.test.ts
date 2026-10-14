import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatEntry } from "./csat-entry.js";

test("CsatEntry starts in requested", () => {
  const item = newCsatEntry("code-747", "label-593");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatEntry moves to revoked", () => {
  const item = newCsatEntry("code-747", "label-593");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("CsatEntry rejects moves from expired", () => {
  const item = newCsatEntry("code-747", "label-593");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
