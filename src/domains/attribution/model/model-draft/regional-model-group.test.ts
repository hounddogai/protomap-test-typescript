import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalModelGroup } from "./regional-model-group.js";

test("RegionalModelGroup starts in open", () => {
  const item = newRegionalModelGroup("code-843", "title-339");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalModelGroup moves to in review", () => {
  const item = newRegionalModelGroup("code-843", "title-339");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RegionalModelGroup rejects moves from archived", () => {
  const item = newRegionalModelGroup("code-843", "title-339");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
