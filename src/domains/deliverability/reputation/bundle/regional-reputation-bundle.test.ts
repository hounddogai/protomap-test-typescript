import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReputationBundle } from "./regional-reputation-bundle.js";

test("RegionalReputationBundle starts in new", () => {
  const item = newRegionalReputationBundle("code-615", "title-278");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReputationBundle moves to queued", () => {
  const item = newRegionalReputationBundle("code-615", "title-278");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RegionalReputationBundle rejects moves from failed", () => {
  const item = newRegionalReputationBundle("code-615", "title-278");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
