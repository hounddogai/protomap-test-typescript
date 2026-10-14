import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCreativeEntry } from "./regional-creative-entry.js";

test("RegionalCreativeEntry starts in open", () => {
  const item = newRegionalCreativeEntry("code-798", "label-446");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCreativeEntry moves to archived", () => {
  const item = newRegionalCreativeEntry("code-798", "label-446");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("RegionalCreativeEntry rejects moves from archived", () => {
  const item = newRegionalCreativeEntry("code-798", "label-446");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
