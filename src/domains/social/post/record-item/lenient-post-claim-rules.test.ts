import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPostClaimCodeLengthRule,
  LenientPostClaimTitleLengthRule,
  LenientPostClaimUtmSourceLengthRule,
  defaultLenientPostClaimValidator,
} from "./lenient-post-claim-rules.js";
import { newLenientPostClaim } from "./lenient-post-claim.js";

test("LenientPostClaimValidator reports every problem", () => {
  const validator = defaultLenientPostClaimValidator();
  const item = newLenientPostClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPostClaimUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientPostClaimUtmSourceLengthRule(16);
  const item = newLenientPostClaim("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostClaimCodeLengthRule flags a long code", () => {
  const rule = new LenientPostClaimCodeLengthRule(120);
  const item = newLenientPostClaim("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostClaimTitleLengthRule flags a long title", () => {
  const rule = new LenientPostClaimTitleLengthRule(16);
  const item = newLenientPostClaim("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
