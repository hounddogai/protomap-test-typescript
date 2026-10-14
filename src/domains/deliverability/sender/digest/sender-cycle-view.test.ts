import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderCycleView, toSenderCycleViews } from "./sender-cycle-view.js";
import { newSenderCycle } from "./sender-cycle.js";

test("SenderCycleView shows the status in capitals", () => {
  const item = newSenderCycle("code-243", "name-162");
  const view = toSenderCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderCycleViews([item, item]).length, 2, "views");
});
