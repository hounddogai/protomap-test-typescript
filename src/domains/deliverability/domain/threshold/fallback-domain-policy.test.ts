import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackDomainPolicy } from "./fallback-domain-policy.js";

test("FallbackDomainPolicy starts in proposed", () => {
  const item = newFallbackDomainPolicy("code-996", "name-669");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackDomainPolicy moves to rejected", () => {
  const item = newFallbackDomainPolicy("code-996", "name-669");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackDomainPolicy rejects moves from withdrawn", () => {
  const item = newFallbackDomainPolicy("code-996", "name-669");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
