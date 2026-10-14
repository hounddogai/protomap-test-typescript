import * as text from "../../../../kit/text.js";

/** Where a csat assignment is in its life cycle. */
export type CsatAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a csat assignment and its current status. */
export class CsatAssignment {
  code: string;
  name: string;
  createdAt: number;
  clicks: number;
  visible: boolean;
  startsAt: number;
  rate: number;
  source: string;
  attempts: number;
  status: CsatAssignmentStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    clicks: number,
    visible: boolean,
    startsAt: number,
    rate: number,
    source: string,
    attempts: number,
    status: CsatAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.visible = visible;
    this.startsAt = startsAt;
    this.rate = rate;
    this.source = source;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CsatAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"csat assignment"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.rate * this.createdAt * 100) / 100;
  }

  copy(): CsatAssignment {
    return new CsatAssignment(
      this.code,
      this.name,
      this.createdAt,
      this.clicks,
      this.visible,
      this.startsAt,
      this.rate,
      this.source,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a csat assignment in status open. */
export function newCsatAssignment(code: string, name: string): CsatAssignment {
  return new CsatAssignment(code, name, 0, 0, false, 0, 0, "", 0, "open");
}
