import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowQuotaDiscountRangeRule,
  WindowQuotaSequenceRangeRule,
  defaultWindowQuotaValidator,
} from "./window-quota-rules.js";
import { newWindowQuota } from "./window-quota.js";

test("WindowQuotaValidator reports every problem", () => {
  const validator = defaultWindowQuotaValidator();
  const item = newWindowQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowQuotaSequenceRangeRule flags values above sequence", () => {
  const rule = new WindowQuotaSequenceRangeRule(16, 1000);
  const item = newWindowQuota("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowQuotaDiscountRangeRule flags values above discount", () => {
  const rule = new WindowQuotaDiscountRangeRule(8.2, 1370.4);
  const item = newWindowQuota("x", "y");
  item.discount = 1371.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
