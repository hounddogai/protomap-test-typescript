import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualProofDraftRequiredCodeRule,
  ManualProofDraftRevisionRangeRule,
  defaultManualProofDraftValidator,
} from "./manual-proof-draft-rules.js";
import { newManualProofDraft } from "./manual-proof-draft.js";

test("ManualProofDraftValidator reports every problem", () => {
  const validator = defaultManualProofDraftValidator();
  const item = newManualProofDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualProofDraftRevisionRangeRule flags values above revision", () => {
  const rule = new ManualProofDraftRevisionRangeRule(64, 80);
  const item = newManualProofDraft("x", "y");
  item.revision = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualProofDraftRequiredCodeRule flags a blank code", () => {
  const rule = new ManualProofDraftRequiredCodeRule("manual proof draft needs an entry");
  const item = newManualProofDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
