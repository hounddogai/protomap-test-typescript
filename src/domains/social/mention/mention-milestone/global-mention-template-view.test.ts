import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalMentionTemplateView, toGlobalMentionTemplateViews } from "./global-mention-template-view.js";
import { newGlobalMentionTemplate } from "./global-mention-template.js";

test("GlobalMentionTemplateView shows the status in capitals", () => {
  const item = newGlobalMentionTemplate("code-700", "label-260");
  const view = toGlobalMentionTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalMentionTemplateViews([item, item]).length, 2, "views");
});
