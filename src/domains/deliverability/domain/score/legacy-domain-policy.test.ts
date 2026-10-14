import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDomainPolicy } from "./legacy-domain-policy.js";

test("LegacyDomainPolicy starts in draft", () => {
  const item = newLegacyDomainPolicy("code-578", "label-645");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDomainPolicy moves to suspended", () => {
  const item = newLegacyDomainPolicy("code-578", "label-645");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LegacyDomainPolicy rejects moves from closed", () => {
  const item = newLegacyDomainPolicy("code-578", "label-645");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
