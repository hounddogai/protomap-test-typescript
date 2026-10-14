import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultInsightExceptionView, toDefaultInsightExceptionViews } from "./default-insight-exception-view.js";
import { newDefaultInsightException } from "./default-insight-exception.js";

test("DefaultInsightExceptionView shows the status in capitals", () => {
  const item = newDefaultInsightException("code-226", "title-492");
  const view = toDefaultInsightExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultInsightExceptionViews([item, item]).length, 2, "views");
});
