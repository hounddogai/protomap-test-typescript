import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathRequest } from "./path-request.js";

test("PathRequest starts in planned", () => {
  const item = newPathRequest("code-128", "name-321");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathRequest moves to cancelled", () => {
  const item = newPathRequest("code-128", "name-321");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("PathRequest rejects moves from cancelled", () => {
  const item = newPathRequest("code-128", "name-321");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
