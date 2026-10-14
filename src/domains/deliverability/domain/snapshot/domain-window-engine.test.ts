import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainWindowEngine } from "./domain-window-engine.js";
import { newDomainWindow } from "./domain-window.js";

test("DomainWindowEngine keeps results within bounds", () => {
  const engine = defaultDomainWindowEngine();
  const item = newDomainWindow("code-563", "label-72");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
