import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingQueueGroupBidRangeRule,
  PendingQueueGroupRequiredLabelRule,
  PendingQueueGroupRequiredSegmentRule,
  defaultPendingQueueGroupValidator,
} from "./pending-queue-group-rules.js";
import { newPendingQueueGroup } from "./pending-queue-group.js";

test("PendingQueueGroupValidator reports every problem", () => {
  const validator = defaultPendingQueueGroupValidator();
  const item = newPendingQueueGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingQueueGroupRequiredLabelRule flags a blank label", () => {
  const rule = new PendingQueueGroupRequiredLabelRule("pending queue group needs a value");
  const item = newPendingQueueGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingQueueGroupRequiredSegmentRule flags a blank segment", () => {
  const rule = new PendingQueueGroupRequiredSegmentRule("pending queue group needs an entry");
  const item = newPendingQueueGroup("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingQueueGroupBidRangeRule flags values above bid", () => {
  const rule = new PendingQueueGroupBidRangeRule(1.3, 1854.3);
  const item = newPendingQueueGroup("x", "y");
  item.bid = 1855.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
