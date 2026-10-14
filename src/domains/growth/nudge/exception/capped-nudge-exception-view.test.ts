import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedNudgeExceptionView, toCappedNudgeExceptionViews } from "./capped-nudge-exception-view.js";
import { newCappedNudgeException } from "./capped-nudge-exception.js";

test("CappedNudgeExceptionView shows the status in capitals", () => {
  const item = newCappedNudgeException("code-99", "label-99");
  const view = toCappedNudgeExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedNudgeExceptionViews([item, item]).length, 2, "views");
});
