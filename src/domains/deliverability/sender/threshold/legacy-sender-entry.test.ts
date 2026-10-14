import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySenderEntry } from "./legacy-sender-entry.js";

test("LegacySenderEntry starts in proposed", () => {
  const item = newLegacySenderEntry("code-964", "title-360");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySenderEntry moves to withdrawn", () => {
  const item = newLegacySenderEntry("code-964", "title-360");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("LegacySenderEntry rejects moves from withdrawn", () => {
  const item = newLegacySenderEntry("code-964", "title-360");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
