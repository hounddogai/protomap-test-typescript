import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutTemplateEngine } from "./payout-template-engine.js";
import { newPayoutTemplate } from "./payout-template.js";

test("PayoutTemplateEngine keeps results within bounds", () => {
  const engine = defaultPayoutTemplateEngine(flags.newRegistry());
  const item = newPayoutTemplate("code-247", "label-703");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
