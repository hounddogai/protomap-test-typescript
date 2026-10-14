import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathLedger } from "./path-ledger.js";

test("PathLedger starts in requested", () => {
  const item = newPathLedger("code-472", "title-797");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathLedger moves to granted", () => {
  const item = newPathLedger("code-472", "title-797");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PathLedger rejects moves from expired", () => {
  const item = newPathLedger("code-472", "title-797");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
