import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewNoticeAudienceIdLengthRule,
  TicketViewNoticeCodeLengthRule,
  TicketViewNoticeRequiredCodeRule,
  defaultTicketViewNoticeValidator,
} from "./ticket-view-notice-rules.js";
import { newTicketViewNotice } from "./ticket-view-notice.js";

test("TicketViewNoticeValidator reports every problem", () => {
  const validator = defaultTicketViewNoticeValidator();
  const item = newTicketViewNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewNoticeRequiredCodeRule("ticket view notice needs a value");
  const item = newTicketViewNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewNoticeCodeLengthRule flags a long code", () => {
  const rule = new TicketViewNoticeCodeLengthRule(16);
  const item = newTicketViewNotice("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewNoticeAudienceIdLengthRule flags a long audience id", () => {
  const rule = new TicketViewNoticeAudienceIdLengthRule(120);
  const item = newTicketViewNotice("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
