import * as clock from "../../../../kit/clock.js";
import { CreativeQuotaEngine, defaultCreativeQuotaEngine } from "./creative-quota-engine.js";
import { CreativeQuotaValidator, defaultCreativeQuotaValidator } from "./creative-quota-rules.js";
import { CreativeQuotaStore } from "./creative-quota-store.js";

/** Moves creative quotas through their life cycle and keeps a journal of what it did. */
export class CreativeQuotaManager {
  store: CreativeQuotaStore;
  validator: CreativeQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeQuotaEngine;

  constructor(
    store: CreativeQuotaStore,
    validator: CreativeQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeQuotaEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative quota ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newCreativeQuotaManager(store: CreativeQuotaStore, clockValue: clock.Clock): CreativeQuotaManager {
  return new CreativeQuotaManager(store, defaultCreativeQuotaValidator(), clockValue, [], defaultCreativeQuotaEngine());
}
