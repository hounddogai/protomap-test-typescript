import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PlacementTemplateEngine, defaultPlacementTemplateEngine } from "./placement-template-engine.js";
import { PlacementTemplateValidator, defaultPlacementTemplateValidator } from "./placement-template-rules.js";
import { PlacementTemplateStore } from "./placement-template-store.js";

/** Moves placement templates through their life cycle and keeps a journal of what it did. */
export class PlacementTemplateCoordinator {
  store: PlacementTemplateStore;
  validator: PlacementTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementTemplateEngine;

  constructor(
    store: PlacementTemplateStore,
    validator: PlacementTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementTemplateEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPlacementTemplateCoordinator(store: PlacementTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PlacementTemplateCoordinator {
  return new PlacementTemplateCoordinator(
    store,
    defaultPlacementTemplateValidator(),
    clockValue,
    [],
    defaultPlacementTemplateEngine(flagsValue),
  );
}
