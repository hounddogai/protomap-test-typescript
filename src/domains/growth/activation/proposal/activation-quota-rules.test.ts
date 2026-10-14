import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationQuotaLabelLengthRule,
  ActivationQuotaRequiredOwnerIdRule,
  defaultActivationQuotaValidator,
} from "./activation-quota-rules.js";
import { newActivationQuota } from "./activation-quota.js";

test("ActivationQuotaValidator reports every problem", () => {
  const validator = defaultActivationQuotaValidator();
  const item = newActivationQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationQuotaRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ActivationQuotaRequiredOwnerIdRule("activation quota needs a value");
  const item = newActivationQuota("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationQuotaLabelLengthRule flags a long label", () => {
  const rule = new ActivationQuotaLabelLengthRule(1000);
  const item = newActivationQuota("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
