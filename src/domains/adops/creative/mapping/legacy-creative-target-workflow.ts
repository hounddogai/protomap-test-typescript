import * as clock from "../../../../kit/clock.js";
import { LegacyCreativeTargetEngine, defaultLegacyCreativeTargetEngine } from "./legacy-creative-target-engine.js";
import {
  LegacyCreativeTargetValidator,
  defaultLegacyCreativeTargetValidator,
} from "./legacy-creative-target-rules.js";
import { LegacyCreativeTargetStore } from "./legacy-creative-target-store.js";

/** Moves legacy creative targets through their life cycle and keeps a journal of what it did. */
export class LegacyCreativeTargetWorkflow {
  store: LegacyCreativeTargetStore;
  validator: LegacyCreativeTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyCreativeTargetEngine;

  constructor(
    store: LegacyCreativeTargetStore,
    validator: LegacyCreativeTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyCreativeTargetEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative target ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyCreativeTargetWorkflow(store: LegacyCreativeTargetStore, clockValue: clock.Clock): LegacyCreativeTargetWorkflow {
  return new LegacyCreativeTargetWorkflow(
    store,
    defaultLegacyCreativeTargetValidator(),
    clockValue,
    [],
    defaultLegacyCreativeTargetEngine(),
  );
}
