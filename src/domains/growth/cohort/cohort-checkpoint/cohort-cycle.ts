import * as text from "../../../../kit/text.js";

/** Where a cohort cycle is in its life cycle. */
export type CohortCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A cohort cycle as the cohort team keeps it. */
export class CohortCycle {
  code: string;
  name: string;
  description: string;
  windowDays: number;
  audienceId: string;
  attributes: Map<string, string>;
  status: CohortCycleStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    windowDays: number,
    audienceId: string,
    attributes: Map<string, string>,
    status: CohortCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CohortCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): CohortCycle {
    return new CohortCycle(
      this.code,
      this.name,
      this.description,
      this.windowDays,
      this.audienceId,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a cohort cycle in status idle. */
export function newCohortCycle(code: string, name: string): CohortCycle {
  return new CohortCycle(code, name, "", 0, "", new Map<string, string>(), "idle");
}
