import * as text from "../../../../kit/text.js";

/** Where a opt out preference is in its life cycle. */
export type OptOutPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One opt out preference, with what the planners need to act on it. */
export class OptOutPreference {
  code: string;
  label: string;
  batchSize: number;
  reviewer: string;
  limit: number;
  rate: number;
  cost: number;
  score: number;
  contactEmail: string;
  revision: number;
  openRate: number;
  status: OptOutPreferenceStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    reviewer: string,
    limit: number,
    rate: number,
    cost: number,
    score: number,
    contactEmail: string,
    revision: number,
    openRate: number,
    status: OptOutPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.limit = limit;
    this.rate = rate;
    this.cost = cost;
    this.score = score;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.openRate = openRate;
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

  canMoveTo(next: OptOutPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
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

  moveTo(next: OptOutPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"opt out preference"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.score + this.limit) * 100) / 100;
  }

  copy(): OptOutPreference {
    return new OptOutPreference(
      this.code,
      this.label,
      this.batchSize,
      this.reviewer,
      this.limit,
      this.rate,
      this.cost,
      this.score,
      this.contactEmail,
      this.revision,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a opt out preference in status planned. */
export function newOptOutPreference(code: string, label: string): OptOutPreference {
  return new OptOutPreference(code, label, 0, "", 0, 0, 0, 0, "", 0, 0, "planned");
}
