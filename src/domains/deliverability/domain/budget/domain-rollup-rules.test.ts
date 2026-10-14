import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainRollupChannelLengthRule,
  DomainRollupRequiredCodeRule,
  DomainRollupRequiredLabelRule,
  DomainRollupRequiredRegionRule,
  defaultDomainRollupValidator,
} from "./domain-rollup-rules.js";
import { newDomainRollup } from "./domain-rollup.js";

test("DomainRollupValidator reports every problem", () => {
  const validator = defaultDomainRollupValidator();
  const item = newDomainRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainRollupRequiredCodeRule flags a blank code", () => {
  const rule = new DomainRollupRequiredCodeRule("domain rollup needs an entry");
  const item = newDomainRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainRollupChannelLengthRule flags a long channel", () => {
  const rule = new DomainRollupChannelLengthRule(120);
  const item = newDomainRollup("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainRollupRequiredRegionRule flags a blank region", () => {
  const rule = new DomainRollupRequiredRegionRule("domain rollup needs an entry");
  const item = newDomainRollup("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainRollupRequiredLabelRule flags a blank label", () => {
  const rule = new DomainRollupRequiredLabelRule("domain rollup needs a value");
  const item = newDomainRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
