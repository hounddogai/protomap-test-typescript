import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDomainSnapshot } from "./adaptive-domain-snapshot.js";

test("AdaptiveDomainSnapshot starts in proposed", () => {
  const item = newAdaptiveDomainSnapshot("code-239", "label-75");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDomainSnapshot moves to approved", () => {
  const item = newAdaptiveDomainSnapshot("code-239", "label-75");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveDomainSnapshot rejects moves from withdrawn", () => {
  const item = newAdaptiveDomainSnapshot("code-239", "label-75");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
