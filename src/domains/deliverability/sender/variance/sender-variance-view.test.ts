import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderVarianceView, toSenderVarianceViews } from "./sender-variance-view.js";
import { newSenderVariance } from "./sender-variance.js";

test("SenderVarianceView shows the status in capitals", () => {
  const item = newSenderVariance("code-490", "title-467");
  const view = toSenderVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderVarianceViews([item, item]).length, 2, "views");
});
