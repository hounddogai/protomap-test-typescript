import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingBidRuleManifestEngine } from "./pending-bid-rule-manifest-engine.js";
import { newPendingBidRuleManifest } from "./pending-bid-rule-manifest.js";

test("PendingBidRuleManifestEngine keeps results within bounds", () => {
  const engine = defaultPendingBidRuleManifestEngine(flags.newRegistry());
  const item = newPendingBidRuleManifest("code-4", "title-626");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
