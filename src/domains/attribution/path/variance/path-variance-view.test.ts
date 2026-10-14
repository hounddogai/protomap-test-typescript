import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathVarianceView, toPathVarianceViews } from "./path-variance-view.js";
import { newPathVariance } from "./path-variance.js";

test("PathVarianceView shows the status in capitals", () => {
  const item = newPathVariance("code-558", "name-134");
  const view = toPathVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathVarianceViews([item, item]).length, 2, "views");
});
