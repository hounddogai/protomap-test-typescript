import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreativeSnapshot } from "./seasonal-creative-snapshot.js";

test("SeasonalCreativeSnapshot starts in proposed", () => {
  const item = newSeasonalCreativeSnapshot("code-790", "title-30");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreativeSnapshot moves to rejected", () => {
  const item = newSeasonalCreativeSnapshot("code-790", "title-30");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SeasonalCreativeSnapshot rejects moves from withdrawn", () => {
  const item = newSeasonalCreativeSnapshot("code-790", "title-30");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
