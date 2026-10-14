import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCsatBundle } from "./lenient-csat-bundle.js";

test("LenientCsatBundle starts in requested", () => {
  const item = newLenientCsatBundle("code-592", "title-232");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCsatBundle moves to granted", () => {
  const item = newLenientCsatBundle("code-592", "title-232");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LenientCsatBundle rejects moves from expired", () => {
  const item = newLenientCsatBundle("code-592", "title-232");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
