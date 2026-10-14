import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultProofRule } from "./default-proof-rule.js";

test("DefaultProofRule starts in planned", () => {
  const item = newDefaultProofRule("code-683", "title-433");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultProofRule moves to scheduled", () => {
  const item = newDefaultProofRule("code-683", "title-433");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultProofRule rejects moves from cancelled", () => {
  const item = newDefaultProofRule("code-683", "title-433");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
