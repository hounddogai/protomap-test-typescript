import * as text from "../../../../kit/text.js";

/** Where a flight entry is in its life cycle. */
export type FlightEntryStatus = "created" | "validated" | "published" | "retired";

/** The record of a flight entry and its current status. */
export class FlightEntry {
  code: string;
  label: string;
  visible: boolean;
  summary: string;
  sequence: number;
  tags: string[];
  frequencyCap: number;
  variant: string;
  status: FlightEntryStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    summary: string,
    sequence: number,
    tags: string[],
    frequencyCap: number,
    variant: string,
    status: FlightEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.summary = summary;
    this.sequence = sequence;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FlightEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.sequence + this.frequencyCap) * 100) / 100;
  }

  copy(): FlightEntry {
    return new FlightEntry(
      this.code,
      this.label,
      this.visible,
      this.summary,
      this.sequence,
      this.tags,
      this.frequencyCap,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a flight entry in status created. */
export function newFlightEntry(code: string, label: string): FlightEntry {
  return new FlightEntry(code, label, false, "", 0, [], 0, "", "created");
}
