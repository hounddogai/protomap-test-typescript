import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainCycleView, toDomainCycleViews } from "./domain-cycle-view.js";
import { newDomainCycle } from "./domain-cycle.js";

test("DomainCycleView shows the status in capitals", () => {
  const item = newDomainCycle("code-707", "name-32");
  const view = toDomainCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainCycleViews([item, item]).length, 2, "views");
});
