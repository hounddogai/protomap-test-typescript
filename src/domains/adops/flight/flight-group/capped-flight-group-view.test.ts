import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFlightGroupView, toCappedFlightGroupViews } from "./capped-flight-group-view.js";
import { newCappedFlightGroup } from "./capped-flight-group.js";

test("CappedFlightGroupView shows the status in capitals", () => {
  const item = newCappedFlightGroup("code-377", "title-818");
  const view = toCappedFlightGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFlightGroupViews([item, item]).length, 2, "views");
});
