import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingDoubleOptInRollupEngine } from "./pending-double-opt-in-rollup-engine.js";
import { newPendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

test("PendingDoubleOptInRollupEngine keeps results within bounds", () => {
  const engine = defaultPendingDoubleOptInRollupEngine(flags.newRegistry());
  const item = newPendingDoubleOptInRollup("code-326", "title-612");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
