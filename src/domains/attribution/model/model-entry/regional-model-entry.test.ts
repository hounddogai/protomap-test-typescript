import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalModelEntry } from "./regional-model-entry.js";

test("RegionalModelEntry starts in requested", () => {
  const item = newRegionalModelEntry("code-300", "title-62");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalModelEntry moves to expired", () => {
  const item = newRegionalModelEntry("code-300", "title-62");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("RegionalModelEntry rejects moves from expired", () => {
  const item = newRegionalModelEntry("code-300", "title-62");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
