import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionGroupEngine } from "./retention-group-engine.js";
import { newRetentionGroup } from "./retention-group.js";

test("RetentionGroupEngine keeps results within bounds", () => {
  const engine = defaultRetentionGroupEngine(flags.newRegistry());
  const item = newRetentionGroup("code-429", "name-186");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
