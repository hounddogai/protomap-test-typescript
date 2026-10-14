import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaCycleView, toSlaCycleViews } from "./sla-cycle-view.js";
import { newSlaCycle } from "./sla-cycle.js";

test("SlaCycleView shows the status in capitals", () => {
  const item = newSlaCycle("code-591", "label-916");
  const view = toSlaCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaCycleViews([item, item]).length, 2, "views");
});
