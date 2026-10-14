import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeSnapshot } from "./creative-snapshot.js";

test("CreativeSnapshot starts in requested", () => {
  const item = newCreativeSnapshot("code-332", "label-105");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeSnapshot moves to granted", () => {
  const item = newCreativeSnapshot("code-332", "label-105");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CreativeSnapshot rejects moves from expired", () => {
  const item = newCreativeSnapshot("code-332", "label-105");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
