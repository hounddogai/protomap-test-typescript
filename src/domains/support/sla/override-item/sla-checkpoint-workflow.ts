import * as clock from "../../../../kit/clock.js";
import { SlaCheckpointEngine, defaultSlaCheckpointEngine } from "./sla-checkpoint-engine.js";
import { SlaCheckpointValidator, defaultSlaCheckpointValidator } from "./sla-checkpoint-rules.js";
import { SlaCheckpointStore } from "./sla-checkpoint-store.js";

/** Moves sla checkpoints through their life cycle and keeps a journal of what it did. */
export class SlaCheckpointDesk {
  store: SlaCheckpointStore;
  validator: SlaCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaCheckpointEngine;

  constructor(
    store: SlaCheckpointStore,
    validator: SlaCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaCheckpointEngine,
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
      throw new Error(`sla checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla checkpoint ${code} not found`);
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
      throw new Error(`sla checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSlaCheckpointDesk(store: SlaCheckpointStore, clockValue: clock.Clock): SlaCheckpointDesk {
  return new SlaCheckpointDesk(store, defaultSlaCheckpointValidator(), clockValue, [], defaultSlaCheckpointEngine());
}
