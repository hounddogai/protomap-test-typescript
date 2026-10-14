import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatRequest } from "./csat-request.js";

test("CsatRequest starts in open", () => {
  const item = newCsatRequest("code-199", "label-517");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatRequest moves to in review", () => {
  const item = newCsatRequest("code-199", "label-517");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CsatRequest rejects moves from archived", () => {
  const item = newCsatRequest("code-199", "label-517");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
