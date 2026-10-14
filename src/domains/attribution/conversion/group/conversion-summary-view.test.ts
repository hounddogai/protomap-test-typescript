import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionSummaryView, toConversionSummaryViews } from "./conversion-summary-view.js";
import { newConversionSummary } from "./conversion-summary.js";

test("ConversionSummaryView shows the status in capitals", () => {
  const item = newConversionSummary("code-609", "label-507");
  const view = toConversionSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionSummaryViews([item, item]).length, 2, "views");
});
