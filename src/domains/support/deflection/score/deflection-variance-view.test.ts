import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionVarianceView, toDeflectionVarianceViews } from "./deflection-variance-view.js";
import { newDeflectionVariance } from "./deflection-variance.js";

test("DeflectionVarianceView shows the status in capitals", () => {
  const item = newDeflectionVariance("code-194", "name-438");
  const view = toDeflectionVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionVarianceViews([item, item]).length, 2, "views");
});
