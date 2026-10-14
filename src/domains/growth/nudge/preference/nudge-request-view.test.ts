import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeRequestView, toNudgeRequestViews } from "./nudge-request-view.js";
import { newNudgeRequest } from "./nudge-request.js";

test("NudgeRequestView shows the status in capitals", () => {
  const item = newNudgeRequest("code-437", "name-228");
  const view = toNudgeRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeRequestViews([item, item]).length, 2, "views");
});
