import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCsatManifestCeilingRangeRule,
  CappedCsatManifestNotesLengthRule,
  CappedCsatManifestUpdatedAtRangeRule,
  defaultCappedCsatManifestValidator,
} from "./capped-csat-manifest-rules.js";
import { newCappedCsatManifest } from "./capped-csat-manifest.js";

test("CappedCsatManifestValidator reports every problem", () => {
  const validator = defaultCappedCsatManifestValidator();
  const item = newCappedCsatManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCsatManifestNotesLengthRule flags a long notes", () => {
  const rule = new CappedCsatManifestNotesLengthRule(16);
  const item = newCappedCsatManifest("x", "y");
  item.notes = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCsatManifestUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CappedCsatManifestUpdatedAtRangeRule(16, 86400);
  const item = newCappedCsatManifest("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCsatManifestCeilingRangeRule flags values above ceiling", () => {
  const rule = new CappedCsatManifestCeilingRangeRule(3.7, 4386.9);
  const item = newCappedCsatManifest("x", "y");
  item.ceiling = 4388.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
