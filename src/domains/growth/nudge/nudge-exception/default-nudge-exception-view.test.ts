import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultNudgeExceptionView, toDefaultNudgeExceptionViews } from "./default-nudge-exception-view.js";
import { newDefaultNudgeException } from "./default-nudge-exception.js";

test("DefaultNudgeExceptionView shows the status in capitals", () => {
  const item = newDefaultNudgeException("code-791", "label-69");
  const view = toDefaultNudgeExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultNudgeExceptionViews([item, item]).length, 2, "views");
});
