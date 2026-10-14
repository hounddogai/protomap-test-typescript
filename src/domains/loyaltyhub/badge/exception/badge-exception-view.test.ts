import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeExceptionView, toBadgeExceptionViews } from "./badge-exception-view.js";
import { newBadgeException } from "./badge-exception.js";

test("BadgeExceptionView shows the status in capitals", () => {
  const item = newBadgeException("code-950", "title-527");
  const view = toBadgeExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeExceptionViews([item, item]).length, 2, "views");
});
