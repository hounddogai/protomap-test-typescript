import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCsatRequest } from "./default-csat-request.js";

test("DefaultCsatRequest starts in created", () => {
  const item = newDefaultCsatRequest("code-577", "title-69");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCsatRequest moves to validated", () => {
  const item = newDefaultCsatRequest("code-577", "title-69");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultCsatRequest rejects moves from retired", () => {
  const item = newDefaultCsatRequest("code-577", "title-69");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
