import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalChallengeMappingView,
  toRegionalChallengeMappingViews,
} from "./regional-challenge-mapping-view.js";
import { newRegionalChallengeMapping } from "./regional-challenge-mapping.js";

test("RegionalChallengeMappingView shows the status in capitals", () => {
  const item = newRegionalChallengeMapping("code-781", "label-59");
  const view = toRegionalChallengeMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalChallengeMappingViews([item, item]).length, 2, "views");
});
