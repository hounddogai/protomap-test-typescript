import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDomainBundle } from "./batched-domain-bundle.js";

test("BatchedDomainBundle starts in planned", () => {
  const item = newBatchedDomainBundle("code-318", "title-876");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDomainBundle moves to in progress", () => {
  const item = newBatchedDomainBundle("code-318", "title-876");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BatchedDomainBundle rejects moves from cancelled", () => {
  const item = newBatchedDomainBundle("code-318", "title-876");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
