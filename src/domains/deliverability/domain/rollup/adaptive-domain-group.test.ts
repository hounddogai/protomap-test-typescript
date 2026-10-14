import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDomainGroup } from "./adaptive-domain-group.js";

test("AdaptiveDomainGroup starts in proposed", () => {
  const item = newAdaptiveDomainGroup("code-430", "title-300");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDomainGroup moves to rejected", () => {
  const item = newAdaptiveDomainGroup("code-430", "title-300");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("AdaptiveDomainGroup rejects moves from withdrawn", () => {
  const item = newAdaptiveDomainGroup("code-430", "title-300");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
