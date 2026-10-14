import * as clock from "../../../../kit/clock.js";
import {
  DefaultFrequencyEstimateEngine,
  defaultDefaultFrequencyEstimateEngine,
} from "./default-frequency-estimate-engine.js";
import {
  DefaultFrequencyEstimateValidator,
  defaultDefaultFrequencyEstimateValidator,
} from "./default-frequency-estimate-rules.js";
import { DefaultFrequencyEstimateStore } from "./default-frequency-estimate-store.js";

/** Moves default frequency estimates through their life cycle and keeps a journal of what it did. */
export class DefaultFrequencyEstimateWorkflow {
  store: DefaultFrequencyEstimateStore;
  validator: DefaultFrequencyEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultFrequencyEstimateEngine;

  constructor(
    store: DefaultFrequencyEstimateStore,
    validator: DefaultFrequencyEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultFrequencyEstimateEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default frequency estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default frequency estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default frequency estimate ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newDefaultFrequencyEstimateWorkflow(store: DefaultFrequencyEstimateStore, clockValue: clock.Clock): DefaultFrequencyEstimateWorkflow {
  return new DefaultFrequencyEstimateWorkflow(
    store,
    defaultDefaultFrequencyEstimateValidator(),
    clockValue,
    [],
    defaultDefaultFrequencyEstimateEngine(),
  );
}
