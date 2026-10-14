import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualConversionProfile } from "./manual-conversion-profile.js";

test("ManualConversionProfile starts in created", () => {
  const item = newManualConversionProfile("code-982", "name-611");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualConversionProfile moves to validated", () => {
  const item = newManualConversionProfile("code-982", "name-611");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ManualConversionProfile rejects moves from retired", () => {
  const item = newManualConversionProfile("code-982", "name-611");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
