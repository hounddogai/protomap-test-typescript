import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPathLedger } from "./default-path-ledger.js";

test("DefaultPathLedger starts in created", () => {
  const item = newDefaultPathLedger("code-172", "name-798");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPathLedger moves to published", () => {
  const item = newDefaultPathLedger("code-172", "name-798");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("DefaultPathLedger rejects moves from retired", () => {
  const item = newDefaultPathLedger("code-172", "name-798");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
