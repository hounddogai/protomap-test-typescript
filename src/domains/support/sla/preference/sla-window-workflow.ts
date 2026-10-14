import * as clock from "../../../../kit/clock.js";
import { SlaWindowEngine, defaultSlaWindowEngine } from "./sla-window-engine.js";
import { SlaWindowValidator, defaultSlaWindowValidator } from "./sla-window-rules.js";
import { SlaWindowStore } from "./sla-window-store.js";

/** Moves sla windows through their life cycle and keeps a journal of what it did. */
export class SlaWindowService {
  store: SlaWindowStore;
  validator: SlaWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaWindowEngine;

  constructor(
    store: SlaWindowStore,
    validator: SlaWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaWindowEngine,
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
      throw new Error(`sla window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla window ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSlaWindowService(store: SlaWindowStore, clockValue: clock.Clock): SlaWindowService {
  return new SlaWindowService(store, defaultSlaWindowValidator(), clockValue, [], defaultSlaWindowEngine());
}
