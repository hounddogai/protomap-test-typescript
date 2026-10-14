import * as text from "../../../../kit/text.js";

/** Where a domain checkpoint is in its life cycle. */
export type DomainCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a domain checkpoint and its current status. */
export class DomainCheckpoint {
  code: string;
  name: string;
  expiresAt: number;
  locale: string;
  frequencyCap: number;
  attempts: number;
  campaignRef: string;
  status: DomainCheckpointStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    locale: string,
    frequencyCap: number,
    attempts: number,
    campaignRef: string,
    status: DomainCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: DomainCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"domain checkpoint"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.frequencyCap - this.attempts) * 100) / 100;
  }

  copy(): DomainCheckpoint {
    return new DomainCheckpoint(
      this.code,
      this.name,
      this.expiresAt,
      this.locale,
      this.frequencyCap,
      this.attempts,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a domain checkpoint in status open. */
export function newDomainCheckpoint(code: string, name: string): DomainCheckpoint {
  return new DomainCheckpoint(code, name, 0, "", 0, 0, "", "open");
}
