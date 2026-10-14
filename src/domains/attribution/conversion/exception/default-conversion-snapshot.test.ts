import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultConversionSnapshot } from "./default-conversion-snapshot.js";

test("DefaultConversionSnapshot starts in proposed", () => {
  const item = newDefaultConversionSnapshot("code-144", "name-363");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultConversionSnapshot moves to approved", () => {
  const item = newDefaultConversionSnapshot("code-144", "name-363");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultConversionSnapshot rejects moves from withdrawn", () => {
  const item = newDefaultConversionSnapshot("code-144", "name-363");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
