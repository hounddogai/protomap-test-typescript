import assert from "node:assert/strict";
import { test } from "node:test";
import * as retry from "./retry.js";

test("Retry stops at the first success", () => {
  const policy = new retry.Policy(4, new retry.ConstantBackoff(10));
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt === 2);
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(used, 3, "attempts");
  assert.equal(policy.totalDelay(), 40, "total delay");
});
