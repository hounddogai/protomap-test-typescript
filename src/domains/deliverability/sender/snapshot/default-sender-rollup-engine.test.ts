import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultSenderRollupEngine } from "./default-sender-rollup-engine.js";
import { newDefaultSenderRollup } from "./default-sender-rollup.js";

test("DefaultSenderRollupEngine keeps results within bounds", () => {
  const engine = defaultDefaultSenderRollupEngine(flags.newRegistry());
  const item = newDefaultSenderRollup("code-381", "label-487");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
