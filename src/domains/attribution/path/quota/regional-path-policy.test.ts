import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPathPolicy } from "./regional-path-policy.js";

test("RegionalPathPolicy starts in created", () => {
  const item = newRegionalPathPolicy("code-700", "label-423");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPathPolicy moves to validated", () => {
  const item = newRegionalPathPolicy("code-700", "label-423");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalPathPolicy rejects moves from retired", () => {
  const item = newRegionalPathPolicy("code-700", "label-423");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
