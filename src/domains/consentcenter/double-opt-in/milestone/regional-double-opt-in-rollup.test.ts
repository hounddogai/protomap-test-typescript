import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

test("RegionalDoubleOptInRollup starts in draft", () => {
  const item = newRegionalDoubleOptInRollup("code-675", "title-736");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalDoubleOptInRollup moves to active", () => {
  const item = newRegionalDoubleOptInRollup("code-675", "title-736");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RegionalDoubleOptInRollup rejects moves from closed", () => {
  const item = newRegionalDoubleOptInRollup("code-675", "title-736");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
