import * as text from "../../../../kit/text.js";

/** Where a csat profile is in its life cycle. */
export type CsatProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A csat profile as the csat team keeps it. */
export class CsatProfile {
  code: string;
  title: string;
  ratio: number;
  sequence: number;
  checksum: string;
  budget: number;
  notes: string;
  status: CsatProfileStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    sequence: number,
    checksum: string,
    budget: number,
    notes: string,
    status: CsatProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.sequence = sequence;
    this.checksum = checksum;
    this.budget = budget;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"csat profile"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.budget * this.ratio * 100) / 100;
  }

  copy(): CsatProfile {
    return new CsatProfile(
      this.code,
      this.title,
      this.ratio,
      this.sequence,
      this.checksum,
      this.budget,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a csat profile in status planned. */
export function newCsatProfile(code: string, title: string): CsatProfile {
  return new CsatProfile(code, title, 0, 0, "", 0, "", "planned");
}
