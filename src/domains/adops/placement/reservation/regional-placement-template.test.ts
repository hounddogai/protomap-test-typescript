import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPlacementTemplate } from "./regional-placement-template.js";

test("RegionalPlacementTemplate starts in new", () => {
  const item = newRegionalPlacementTemplate("code-495", "title-797");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPlacementTemplate moves to running", () => {
  const item = newRegionalPlacementTemplate("code-495", "title-797");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RegionalPlacementTemplate rejects moves from failed", () => {
  const item = newRegionalPlacementTemplate("code-495", "title-797");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
