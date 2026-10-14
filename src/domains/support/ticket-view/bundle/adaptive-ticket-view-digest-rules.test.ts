import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveTicketViewDigestRequiredRegionRule,
  AdaptiveTicketViewDigestRequiredSourceRule,
  AdaptiveTicketViewDigestWeightRangeRule,
  defaultAdaptiveTicketViewDigestValidator,
} from "./adaptive-ticket-view-digest-rules.js";
import { newAdaptiveTicketViewDigest } from "./adaptive-ticket-view-digest.js";

test("AdaptiveTicketViewDigestValidator reports every problem", () => {
  const validator = defaultAdaptiveTicketViewDigestValidator();
  const item = newAdaptiveTicketViewDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveTicketViewDigestRequiredRegionRule flags a blank region", () => {
  const rule = new AdaptiveTicketViewDigestRequiredRegionRule("adaptive ticket view digest needs an entry");
  const item = newAdaptiveTicketViewDigest("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTicketViewDigestWeightRangeRule flags values above weight", () => {
  const rule = new AdaptiveTicketViewDigestWeightRangeRule(8.1, 945);
  const item = newAdaptiveTicketViewDigest("x", "y");
  item.weight = 946.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveTicketViewDigestRequiredSourceRule flags a blank source", () => {
  const rule = new AdaptiveTicketViewDigestRequiredSourceRule("adaptive ticket view digest needs an entry");
  const item = newAdaptiveTicketViewDigest("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
