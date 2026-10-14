import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatGroup } from "./csat-group.js";

test("CsatGroup starts in requested", () => {
  const item = newCsatGroup("code-883", "title-796");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatGroup moves to granted", () => {
  const item = newCsatGroup("code-883", "title-796");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CsatGroup rejects moves from expired", () => {
  const item = newCsatGroup("code-883", "title-796");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
