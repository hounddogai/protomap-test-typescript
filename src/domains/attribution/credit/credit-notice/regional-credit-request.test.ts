import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCreditRequest } from "./regional-credit-request.js";

test("RegionalCreditRequest starts in new", () => {
  const item = newRegionalCreditRequest("code-520", "name-937");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCreditRequest moves to queued", () => {
  const item = newRegionalCreditRequest("code-520", "name-937");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RegionalCreditRequest rejects moves from failed", () => {
  const item = newRegionalCreditRequest("code-520", "name-937");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
