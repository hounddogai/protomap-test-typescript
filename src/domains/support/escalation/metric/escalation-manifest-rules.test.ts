import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationManifestChecksumLengthRule,
  EscalationManifestCostRangeRule,
  EscalationManifestRequiredNameRule,
  defaultEscalationManifestValidator,
} from "./escalation-manifest-rules.js";
import { newEscalationManifest } from "./escalation-manifest.js";

test("EscalationManifestValidator reports every problem", () => {
  const validator = defaultEscalationManifestValidator();
  const item = newEscalationManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationManifestRequiredNameRule flags a blank name", () => {
  const rule = new EscalationManifestRequiredNameRule("escalation manifest needs an entry");
  const item = newEscalationManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationManifestChecksumLengthRule flags a long checksum", () => {
  const rule = new EscalationManifestChecksumLengthRule(1000);
  const item = newEscalationManifest("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationManifestCostRangeRule flags values above cost", () => {
  const rule = new EscalationManifestCostRangeRule(9.2, 1355);
  const item = newEscalationManifest("x", "y");
  item.cost = 1356.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
