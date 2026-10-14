import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveBadgeExceptionView, toAdaptiveBadgeExceptionViews } from "./adaptive-badge-exception-view.js";
import { newAdaptiveBadgeException } from "./adaptive-badge-exception.js";

test("AdaptiveBadgeExceptionView shows the status in capitals", () => {
  const item = newAdaptiveBadgeException("code-715", "label-100");
  const view = toAdaptiveBadgeExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBadgeExceptionViews([item, item]).length, 2, "views");
});
