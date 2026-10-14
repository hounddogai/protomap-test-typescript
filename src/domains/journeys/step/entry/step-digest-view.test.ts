import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepDigestView, toStepDigestViews } from "./step-digest-view.js";
import { newStepDigest } from "./step-digest.js";

test("StepDigestView shows the status in capitals", () => {
  const item = newStepDigest("code-363", "label-824");
  const view = toStepDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepDigestViews([item, item]).length, 2, "views");
});
