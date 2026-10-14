import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeRecord } from "./creative-record.js";

test("CreativeRecord starts in planned", () => {
  const item = newCreativeRecord("code-966", "name-908");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeRecord moves to in progress", () => {
  const item = newCreativeRecord("code-966", "name-908");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CreativeRecord rejects moves from cancelled", () => {
  const item = newCreativeRecord("code-966", "name-908");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
