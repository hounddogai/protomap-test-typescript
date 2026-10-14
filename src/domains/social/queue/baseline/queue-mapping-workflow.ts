import * as clock from "../../../../kit/clock.js";
import { QueueMappingValidator, defaultQueueMappingValidator } from "./queue-mapping-rules.js";
import { QueueMappingStore } from "./queue-mapping-store.js";

/** Moves queue mappings through their life cycle and keeps a journal of what it did. */
export class QueueMappingManager {
  store: QueueMappingStore;
  validator: QueueMappingValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: QueueMappingStore,
    validator: QueueMappingValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newQueueMappingManager(store: QueueMappingStore, clockValue: clock.Clock): QueueMappingManager {
  return new QueueMappingManager(store, defaultQueueMappingValidator(), clockValue, []);
}
