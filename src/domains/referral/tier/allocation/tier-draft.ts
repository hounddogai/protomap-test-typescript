import * as text from "../../../../kit/text.js";

/** Where a tier draft is in its life cycle. */
export type TierDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One tier draft, with what the planners need to act on it. */
export class TierDraft {
  code: string;
  name: string;
  attempts: number;
  checksum: string;
  version: number;
  label: string;
  audienceId: string;
  capacity: number;
  visible: boolean;
  status: TierDraftStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    checksum: string,
    version: number,
    label: string,
    audienceId: string,
    capacity: number,
    visible: boolean,
    status: TierDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.checksum = checksum;
    this.version = version;
    this.label = label;
    this.audienceId = audienceId;
    this.capacity = capacity;
    this.visible = visible;
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

  canMoveTo(next: TierDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TierDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"tier draft"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.capacity - this.attempts) * 100) / 100;
  }

  copy(): TierDraft {
    return new TierDraft(
      this.code,
      this.name,
      this.attempts,
      this.checksum,
      this.version,
      this.label,
      this.audienceId,
      this.capacity,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tier draft in status open. */
export function newTierDraft(code: string, name: string): TierDraft {
  return new TierDraft(code, name, 0, "", 0, "", "", 0, false, "open");
}
