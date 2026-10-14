/**
 * The sla score records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla score is in its life cycle. */
export type SlaScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A sla score. Its code is unique within a tenant. */
export class SlaScore {
  code: string;
  title: string;
  visible: boolean;
  capacity: number;
  sequence: number;
  frequencyCap: number;
  status: SlaScoreStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    capacity: number,
    sequence: number,
    frequencyCap: number,
    status: SlaScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.capacity = capacity;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: SlaScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SlaScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sla score"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.capacity * this.sequence * 100) / 100;
  }

  copy(): SlaScore {
    return new SlaScore(
      this.code,
      this.title,
      this.visible,
      this.capacity,
      this.sequence,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sla score in status planned. */
export function newSlaScore(code: string, title: string): SlaScore {
  return new SlaScore(code, title, false, 0, 0, 0, "planned");
}
