import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCsatMapping } from "./tiered-csat-mapping.js";

test("TieredCsatMapping starts in proposed", () => {
  const item = newTieredCsatMapping("code-962", "title-975");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCsatMapping moves to rejected", () => {
  const item = newTieredCsatMapping("code-962", "title-975");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("TieredCsatMapping rejects moves from withdrawn", () => {
  const item = newTieredCsatMapping("code-962", "title-975");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
