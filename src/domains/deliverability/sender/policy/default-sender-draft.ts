import * as text from "../../../../kit/text.js";

/** Where a default sender draft is in its life cycle. */
export type DefaultSenderDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** A default sender draft as the sender team keeps it. */
export class DefaultSenderDraft {
  code: string;
  name: string;
  budget: number;
  priority: number;
  reviewer: string;
  endsAt: number;
  status: DefaultSenderDraftStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    priority: number,
    reviewer: string,
    endsAt: number,
    status: DefaultSenderDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.priority = priority;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultSenderDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultSenderDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sender draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default sender draft"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.priority - this.budget) * 100) / 100;
  }

  copy(): DefaultSenderDraft {
    return new DefaultSenderDraft(
      this.code,
      this.name,
      this.budget,
      this.priority,
      this.reviewer,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default sender draft in status requested. */
export function newDefaultSenderDraft(code: string, name: string): DefaultSenderDraft {
  return new DefaultSenderDraft(code, name, 0, 0, "", 0, "requested");
}
