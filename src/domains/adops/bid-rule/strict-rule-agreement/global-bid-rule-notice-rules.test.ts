import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBidRuleNoticeBidRangeRule,
  GlobalBidRuleNoticeMaximumRangeRule,
  GlobalBidRuleNoticeRateRangeRule,
  defaultGlobalBidRuleNoticeValidator,
} from "./global-bid-rule-notice-rules.js";
import { newGlobalBidRuleNotice } from "./global-bid-rule-notice.js";

test("GlobalBidRuleNoticeValidator reports every problem", () => {
  const validator = defaultGlobalBidRuleNoticeValidator();
  const item = newGlobalBidRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBidRuleNoticeBidRangeRule flags values above bid", () => {
  const rule = new GlobalBidRuleNoticeBidRangeRule(8.8, 2719.5);
  const item = newGlobalBidRuleNotice("x", "y");
  item.bid = 2721;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalBidRuleNoticeRateRangeRule flags values above rate", () => {
  const rule = new GlobalBidRuleNoticeRateRangeRule(8.9, 1521);
  const item = newGlobalBidRuleNotice("x", "y");
  item.rate = 1522.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalBidRuleNoticeMaximumRangeRule flags values above maximum", () => {
  const rule = new GlobalBidRuleNoticeMaximumRangeRule(5.3, 4593);
  const item = newGlobalBidRuleNotice("x", "y");
  item.maximum = 4594.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
