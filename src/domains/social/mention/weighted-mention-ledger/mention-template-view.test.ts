import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionTemplateView, toMentionTemplateViews } from "./mention-template-view.js";
import { newMentionTemplate } from "./mention-template.js";

test("MentionTemplateView shows the status in capitals", () => {
  const item = newMentionTemplate("code-254", "name-925");
  const view = toMentionTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionTemplateViews([item, item]).length, 2, "views");
});
