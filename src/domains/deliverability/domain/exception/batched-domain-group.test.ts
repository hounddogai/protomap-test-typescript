import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDomainGroup } from "./batched-domain-group.js";

test("BatchedDomainGroup starts in planned", () => {
  const item = newBatchedDomainGroup("code-321", "name-529");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDomainGroup moves to scheduled", () => {
  const item = newBatchedDomainGroup("code-321", "name-529");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedDomainGroup rejects moves from cancelled", () => {
  const item = newBatchedDomainGroup("code-321", "name-529");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
