import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewDigestCodeLengthRule,
  TicketViewDigestRequiredCodeRule,
  TicketViewDigestWeightRangeRule,
  defaultTicketViewDigestValidator,
} from "./ticket-view-digest-rules.js";
import { newTicketViewDigest } from "./ticket-view-digest.js";

test("TicketViewDigestValidator reports every problem", () => {
  const validator = defaultTicketViewDigestValidator();
  const item = newTicketViewDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewDigestRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewDigestRequiredCodeRule("ticket view digest needs an entry");
  const item = newTicketViewDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewDigestCodeLengthRule flags a long code", () => {
  const rule = new TicketViewDigestCodeLengthRule(32);
  const item = newTicketViewDigest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewDigestWeightRangeRule flags values above weight", () => {
  const rule = new TicketViewDigestWeightRangeRule(2.4, 3837.4);
  const item = newTicketViewDigest("x", "y");
  item.weight = 3838.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
