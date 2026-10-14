import * as clock from "../../../../kit/clock.js";
import { CreativeManifestValidator, defaultCreativeManifestValidator } from "./creative-manifest-rules.js";
import { CreativeManifestStore } from "./creative-manifest-store.js";

/** Moves creative manifests through their life cycle and keeps a journal of what it did. */
export class CreativeManifestService {
  store: CreativeManifestStore;
  validator: CreativeManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CreativeManifestStore,
    validator: CreativeManifestValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newCreativeManifestService(store: CreativeManifestStore, clockValue: clock.Clock): CreativeManifestService {
  return new CreativeManifestService(store, defaultCreativeManifestValidator(), clockValue, []);
}
