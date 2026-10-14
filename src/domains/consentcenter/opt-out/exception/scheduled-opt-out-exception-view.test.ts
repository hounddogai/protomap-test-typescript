import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledOptOutExceptionView,
  toScheduledOptOutExceptionViews,
} from "./scheduled-opt-out-exception-view.js";
import { newScheduledOptOutException } from "./scheduled-opt-out-exception.js";

test("ScheduledOptOutExceptionView shows the status in capitals", () => {
  const item = newScheduledOptOutException("code-772", "title-325");
  const view = toScheduledOptOutExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledOptOutExceptionViews([item, item]).length, 2, "views");
});
