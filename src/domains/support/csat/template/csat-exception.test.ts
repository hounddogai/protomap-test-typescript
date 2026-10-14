import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatException } from "./csat-exception.js";

test("CsatException starts in planned", () => {
  const item = newCsatException("code-139", "title-355");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatException moves to scheduled", () => {
  const item = newCsatException("code-139", "title-355");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CsatException rejects moves from cancelled", () => {
  const item = newCsatException("code-139", "title-355");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
