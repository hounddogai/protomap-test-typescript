import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaGroupEngine } from "./sla-group-engine.js";
import { newSlaGroup } from "./sla-group.js";

test("SlaGroupEngine keeps results within bounds", () => {
  const engine = defaultSlaGroupEngine();
  const item = newSlaGroup("code-799", "title-736");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
