import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatProfile } from "./csat-profile.js";

test("CsatProfile starts in planned", () => {
  const item = newCsatProfile("code-971", "title-555");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatProfile moves to in progress", () => {
  const item = newCsatProfile("code-971", "title-555");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CsatProfile rejects moves from cancelled", () => {
  const item = newCsatProfile("code-971", "title-555");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
