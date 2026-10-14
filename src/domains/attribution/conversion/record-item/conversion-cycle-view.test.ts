import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionCycleView, toConversionCycleViews } from "./conversion-cycle-view.js";
import { newConversionCycle } from "./conversion-cycle.js";

test("ConversionCycleView shows the status in capitals", () => {
  const item = newConversionCycle("code-477", "name-325");
  const view = toConversionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionCycleViews([item, item]).length, 2, "views");
});
