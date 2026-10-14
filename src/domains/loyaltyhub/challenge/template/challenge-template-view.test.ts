import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeTemplateView, toChallengeTemplateViews } from "./challenge-template-view.js";
import { newChallengeTemplate } from "./challenge-template.js";

test("ChallengeTemplateView shows the status in capitals", () => {
  const item = newChallengeTemplate("code-972", "label-452");
  const view = toChallengeTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeTemplateViews([item, item]).length, 2, "views");
});
