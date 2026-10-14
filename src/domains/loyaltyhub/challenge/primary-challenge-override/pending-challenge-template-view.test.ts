import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingChallengeTemplateView,
  toPendingChallengeTemplateViews,
} from "./pending-challenge-template-view.js";
import { newPendingChallengeTemplate } from "./pending-challenge-template.js";

test("PendingChallengeTemplateView shows the status in capitals", () => {
  const item = newPendingChallengeTemplate("code-139", "name-570");
  const view = toPendingChallengeTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingChallengeTemplateViews([item, item]).length, 2, "views");
});
