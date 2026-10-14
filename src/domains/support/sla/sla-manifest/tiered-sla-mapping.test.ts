import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSlaMapping } from "./tiered-sla-mapping.js";

test("TieredSlaMapping starts in proposed", () => {
  const item = newTieredSlaMapping("code-241", "title-966");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSlaMapping moves to withdrawn", () => {
  const item = newTieredSlaMapping("code-241", "title-966");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("TieredSlaMapping rejects moves from withdrawn", () => {
  const item = newTieredSlaMapping("code-241", "title-966");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
