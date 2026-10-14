import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTierRecord } from "./primary-tier-record.js";

test("PrimaryTierRecord starts in created", () => {
  const item = newPrimaryTierRecord("code-667", "title-407");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTierRecord moves to validated", () => {
  const item = newPrimaryTierRecord("code-667", "title-407");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PrimaryTierRecord rejects moves from retired", () => {
  const item = newPrimaryTierRecord("code-667", "title-407");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
