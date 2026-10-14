import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackInsightExceptionView,
  toFallbackInsightExceptionViews,
} from "./fallback-insight-exception-view.js";
import { newFallbackInsightException } from "./fallback-insight-exception.js";

test("FallbackInsightExceptionView shows the status in capitals", () => {
  const item = newFallbackInsightException("code-821", "name-7");
  const view = toFallbackInsightExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackInsightExceptionViews([item, item]).length, 2, "views");
});
