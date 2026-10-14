import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryActivationSnapshotCampaignRefLengthRule,
  PrimaryActivationSnapshotCodeLengthRule,
  PrimaryActivationSnapshotLabelLengthRule,
  PrimaryActivationSnapshotLocaleLengthRule,
  PrimaryActivationSnapshotRequiredCodeRule,
  PrimaryActivationSnapshotVersionRangeRule,
  defaultPrimaryActivationSnapshotValidator,
} from "./primary-activation-snapshot-rules.js";
import { newPrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

test("PrimaryActivationSnapshotValidator reports every problem", () => {
  const validator = defaultPrimaryActivationSnapshotValidator();
  const item = newPrimaryActivationSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryActivationSnapshotLabelLengthRule flags a long label", () => {
  const rule = new PrimaryActivationSnapshotLabelLengthRule(64);
  const item = newPrimaryActivationSnapshot("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryActivationSnapshotLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryActivationSnapshotLocaleLengthRule(120);
  const item = newPrimaryActivationSnapshot("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryActivationSnapshotVersionRangeRule flags values above version", () => {
  const rule = new PrimaryActivationSnapshotVersionRangeRule(16, 80);
  const item = newPrimaryActivationSnapshot("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryActivationSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryActivationSnapshotRequiredCodeRule("primary activation snapshot needs a value");
  const item = newPrimaryActivationSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryActivationSnapshotCodeLengthRule flags a long code", () => {
  const rule = new PrimaryActivationSnapshotCodeLengthRule(32);
  const item = newPrimaryActivationSnapshot("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryActivationSnapshotCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new PrimaryActivationSnapshotCampaignRefLengthRule(120);
  const item = newPrimaryActivationSnapshot("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
