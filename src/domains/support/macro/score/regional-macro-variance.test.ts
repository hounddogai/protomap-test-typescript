import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalMacroVariance } from "./regional-macro-variance.js";

test("RegionalMacroVariance starts in requested", () => {
  const item = newRegionalMacroVariance("code-112", "name-204");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalMacroVariance moves to granted", () => {
  const item = newRegionalMacroVariance("code-112", "name-204");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalMacroVariance rejects moves from expired", () => {
  const item = newRegionalMacroVariance("code-112", "name-204");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
