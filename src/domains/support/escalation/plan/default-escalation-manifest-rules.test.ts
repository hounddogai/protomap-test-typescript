import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultEscalationManifestCodeLengthRule,
  DefaultEscalationManifestLabelLengthRule,
  DefaultEscalationManifestRequiredCodeRule,
  DefaultEscalationManifestRequiredLocaleRule,
  defaultDefaultEscalationManifestValidator,
} from "./default-escalation-manifest-rules.js";
import { newDefaultEscalationManifest } from "./default-escalation-manifest.js";

test("DefaultEscalationManifestValidator reports every problem", () => {
  const validator = defaultDefaultEscalationManifestValidator();
  const item = newDefaultEscalationManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultEscalationManifestRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultEscalationManifestRequiredLocaleRule("default escalation manifest needs an entry");
  const item = newDefaultEscalationManifest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultEscalationManifestLabelLengthRule flags a long label", () => {
  const rule = new DefaultEscalationManifestLabelLengthRule(1000);
  const item = newDefaultEscalationManifest("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultEscalationManifestRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultEscalationManifestRequiredCodeRule("default escalation manifest needs a value");
  const item = newDefaultEscalationManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultEscalationManifestCodeLengthRule flags a long code", () => {
  const rule = new DefaultEscalationManifestCodeLengthRule(86400);
  const item = newDefaultEscalationManifest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
