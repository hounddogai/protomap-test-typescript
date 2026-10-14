import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalWaitEntry } from "./regional-wait-entry.js";

test("RegionalWaitEntry starts in open", () => {
  const item = newRegionalWaitEntry("code-220", "label-2");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalWaitEntry moves to in review", () => {
  const item = newRegionalWaitEntry("code-220", "label-2");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RegionalWaitEntry rejects moves from archived", () => {
  const item = newRegionalWaitEntry("code-220", "label-2");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
