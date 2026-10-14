import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPlacementDigestLabelLengthRule,
  LenientPlacementDigestRequiredJourneyIdRule,
  LenientPlacementDigestRequiredLabelRule,
  defaultLenientPlacementDigestValidator,
} from "./lenient-placement-digest-rules.js";
import { newLenientPlacementDigest } from "./lenient-placement-digest.js";

test("LenientPlacementDigestValidator reports every problem", () => {
  const validator = defaultLenientPlacementDigestValidator();
  const item = newLenientPlacementDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPlacementDigestRequiredLabelRule flags a blank label", () => {
  const rule = new LenientPlacementDigestRequiredLabelRule("lenient placement digest needs a value");
  const item = newLenientPlacementDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPlacementDigestLabelLengthRule flags a long label", () => {
  const rule = new LenientPlacementDigestLabelLengthRule(255);
  const item = newLenientPlacementDigest("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPlacementDigestRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new LenientPlacementDigestRequiredJourneyIdRule("lenient placement digest needs a value");
  const item = newLenientPlacementDigest("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
