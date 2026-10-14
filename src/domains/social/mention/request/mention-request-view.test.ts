import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionRequestView, toMentionRequestViews } from "./mention-request-view.js";
import { newMentionRequest } from "./mention-request.js";

test("MentionRequestView shows the status in capitals", () => {
  const item = newMentionRequest("code-153", "title-81");
  const view = toMentionRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionRequestViews([item, item]).length, 2, "views");
});
