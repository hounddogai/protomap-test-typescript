import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInVarianceView, toDoubleOptInVarianceViews } from "./double-opt-in-variance-view.js";
import { newDoubleOptInVariance } from "./double-opt-in-variance.js";

test("DoubleOptInVarianceView shows the status in capitals", () => {
  const item = newDoubleOptInVariance("code-910", "title-565");
  const view = toDoubleOptInVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInVarianceViews([item, item]).length, 2, "views");
});
