import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditGroupEngine } from "./credit-group-engine.js";
import { newCreditGroup } from "./credit-group.js";

test("CreditGroupEngine keeps results within bounds", () => {
  const engine = defaultCreditGroupEngine(flags.newRegistry());
  const item = newCreditGroup("code-89", "name-224");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
