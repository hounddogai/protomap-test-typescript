import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPostAdjustment } from "./regional-post-adjustment.js";

test("RegionalPostAdjustment starts in proposed", () => {
  const item = newRegionalPostAdjustment("code-129", "label-579");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPostAdjustment moves to withdrawn", () => {
  const item = newRegionalPostAdjustment("code-129", "label-579");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RegionalPostAdjustment rejects moves from withdrawn", () => {
  const item = newRegionalPostAdjustment("code-129", "label-579");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
