import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceClaim } from "./bounce-claim.js";

test("BounceClaim starts in requested", () => {
  const item = newBounceClaim("code-461", "title-797");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceClaim moves to granted", () => {
  const item = newBounceClaim("code-461", "title-797");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BounceClaim rejects moves from expired", () => {
  const item = newBounceClaim("code-461", "title-797");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
