import * as clock from "../../../../kit/clock.js";
import {
  RollingPacingMappingValidator,
  defaultRollingPacingMappingValidator,
} from "./rolling-pacing-mapping-rules.js";
import { RollingPacingMappingStore } from "./rolling-pacing-mapping-store.js";

/** Moves rolling pacing mappings through their life cycle and keeps a journal of what it did. */
export class RollingPacingMappingWorkflow {
  store: RollingPacingMappingStore;
  validator: RollingPacingMappingValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingPacingMappingStore,
    validator: RollingPacingMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling pacing mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling pacing mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newRollingPacingMappingWorkflow(store: RollingPacingMappingStore, clockValue: clock.Clock): RollingPacingMappingWorkflow {
  return new RollingPacingMappingWorkflow(store, defaultRollingPacingMappingValidator(), clockValue, []);
}
