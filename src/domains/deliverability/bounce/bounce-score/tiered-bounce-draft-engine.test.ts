import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredBounceDraftEngine } from "./tiered-bounce-draft-engine.js";
import { newTieredBounceDraft } from "./tiered-bounce-draft.js";

test("TieredBounceDraftEngine keeps results within bounds", () => {
  const engine = defaultTieredBounceDraftEngine(flags.newRegistry());
  const item = newTieredBounceDraft("code-36", "name-410");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
