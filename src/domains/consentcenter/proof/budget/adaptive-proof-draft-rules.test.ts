import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveProofDraftNameLengthRule,
  AdaptiveProofDraftRequiredNameRule,
  defaultAdaptiveProofDraftValidator,
} from "./adaptive-proof-draft-rules.js";
import { newAdaptiveProofDraft } from "./adaptive-proof-draft.js";

test("AdaptiveProofDraftValidator reports every problem", () => {
  const validator = defaultAdaptiveProofDraftValidator();
  const item = newAdaptiveProofDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveProofDraftNameLengthRule flags a long name", () => {
  const rule = new AdaptiveProofDraftNameLengthRule(1000);
  const item = newAdaptiveProofDraft("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveProofDraftRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveProofDraftRequiredNameRule("adaptive proof draft needs an entry");
  const item = newAdaptiveProofDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
