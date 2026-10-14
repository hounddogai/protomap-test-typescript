import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteTemplateView, toInviteTemplateViews } from "./invite-template-view.js";
import { newInviteTemplate } from "./invite-template.js";

test("InviteTemplateView shows the status in capitals", () => {
  const item = newInviteTemplate("code-346", "label-730");
  const view = toInviteTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteTemplateViews([item, item]).length, 2, "views");
});
