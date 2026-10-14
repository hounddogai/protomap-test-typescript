import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationMappingView, toReputationMappingViews } from "./reputation-mapping-view.js";
import { newReputationMapping } from "./reputation-mapping.js";

test("ReputationMappingView shows the status in capitals", () => {
  const item = newReputationMapping("code-218", "name-579");
  const view = toReputationMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationMappingViews([item, item]).length, 2, "views");
});
