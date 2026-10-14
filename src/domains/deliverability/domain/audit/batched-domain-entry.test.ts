import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDomainEntry } from "./batched-domain-entry.js";

test("BatchedDomainEntry starts in created", () => {
  const item = newBatchedDomainEntry("code-470", "name-33");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDomainEntry moves to published", () => {
  const item = newBatchedDomainEntry("code-470", "name-33");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedDomainEntry rejects moves from retired", () => {
  const item = newBatchedDomainEntry("code-470", "name-33");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
