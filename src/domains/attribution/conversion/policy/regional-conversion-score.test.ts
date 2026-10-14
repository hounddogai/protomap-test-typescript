import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalConversionScore } from "./regional-conversion-score.js";

test("RegionalConversionScore starts in created", () => {
  const item = newRegionalConversionScore("code-681", "label-478");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalConversionScore moves to published", () => {
  const item = newRegionalConversionScore("code-681", "label-478");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RegionalConversionScore rejects moves from retired", () => {
  const item = newRegionalConversionScore("code-681", "label-478");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
