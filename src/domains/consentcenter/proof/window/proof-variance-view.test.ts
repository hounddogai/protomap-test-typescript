import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofVarianceView, toProofVarianceViews } from "./proof-variance-view.js";
import { newProofVariance } from "./proof-variance.js";

test("ProofVarianceView shows the status in capitals", () => {
  const item = newProofVariance("code-658", "name-797");
  const view = toProofVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofVarianceViews([item, item]).length, 2, "views");
});
