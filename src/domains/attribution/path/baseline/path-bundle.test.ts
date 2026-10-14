import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathBundle } from "./path-bundle.js";

test("PathBundle starts in proposed", () => {
  const item = newPathBundle("code-848", "title-433");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathBundle moves to approved", () => {
  const item = newPathBundle("code-848", "title-433");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PathBundle rejects moves from withdrawn", () => {
  const item = newPathBundle("code-848", "title-433");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
