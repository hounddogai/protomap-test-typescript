import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatDigest } from "./csat-digest.js";

test("CsatDigest starts in created", () => {
  const item = newCsatDigest("code-264", "label-786");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatDigest moves to validated", () => {
  const item = newCsatDigest("code-264", "label-786");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CsatDigest rejects moves from retired", () => {
  const item = newCsatDigest("code-264", "label-786");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
