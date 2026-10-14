import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathEntry } from "./path-entry.js";

test("PathEntry starts in planned", () => {
  const item = newPathEntry("code-631", "title-602");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathEntry moves to scheduled", () => {
  const item = newPathEntry("code-631", "title-602");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PathEntry rejects moves from cancelled", () => {
  const item = newPathEntry("code-631", "title-602");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
