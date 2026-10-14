import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationTemplate } from "./reputation-template.js";

test("ReputationTemplate starts in created", () => {
  const item = newReputationTemplate("code-526", "title-875");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationTemplate moves to published", () => {
  const item = newReputationTemplate("code-526", "title-875");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ReputationTemplate rejects moves from retired", () => {
  const item = newReputationTemplate("code-526", "title-875");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
