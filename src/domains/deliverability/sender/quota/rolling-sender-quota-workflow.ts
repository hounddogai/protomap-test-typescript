import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingSenderQuotaEngine, defaultRollingSenderQuotaEngine } from "./rolling-sender-quota-engine.js";
import { RollingSenderQuotaValidator, defaultRollingSenderQuotaValidator } from "./rolling-sender-quota-rules.js";
import { RollingSenderQuotaStore } from "./rolling-sender-quota-store.js";

/** Moves rolling sender quotas through their life cycle and keeps a journal of what it did. */
export class RollingSenderQuotaService {
  store: RollingSenderQuotaStore;
  validator: RollingSenderQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingSenderQuotaEngine;

  constructor(
    store: RollingSenderQuotaStore,
    validator: RollingSenderQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingSenderQuotaEngine,
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
      throw new Error(`rolling sender quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling sender quota ${code} not found`);
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
      throw new Error(`rolling sender quota ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingSenderQuotaService(store: RollingSenderQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingSenderQuotaService {
  return new RollingSenderQuotaService(
    store,
    defaultRollingSenderQuotaValidator(),
    clockValue,
    [],
    defaultRollingSenderQuotaEngine(flagsValue),
  );
}
