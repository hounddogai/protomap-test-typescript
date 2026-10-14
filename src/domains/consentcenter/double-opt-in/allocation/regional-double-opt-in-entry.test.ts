import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

test("RegionalDoubleOptInEntry starts in created", () => {
  const item = newRegionalDoubleOptInEntry("code-260", "label-736");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalDoubleOptInEntry moves to retired", () => {
  const item = newRegionalDoubleOptInEntry("code-260", "label-736");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("RegionalDoubleOptInEntry rejects moves from retired", () => {
  const item = newRegionalDoubleOptInEntry("code-260", "label-736");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
