import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPathBundle } from "./regional-path-bundle.js";

test("RegionalPathBundle starts in created", () => {
  const item = newRegionalPathBundle("code-708", "label-195");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPathBundle moves to validated", () => {
  const item = newRegionalPathBundle("code-708", "label-195");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalPathBundle rejects moves from retired", () => {
  const item = newRegionalPathBundle("code-708", "label-195");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
