import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionEntry } from "./deflection-entry.js";

test("DeflectionEntry starts in planned", () => {
  const item = newDeflectionEntry("code-972", "title-301");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionEntry moves to scheduled", () => {
  const item = newDeflectionEntry("code-972", "title-301");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DeflectionEntry rejects moves from cancelled", () => {
  const item = newDeflectionEntry("code-972", "title-301");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
